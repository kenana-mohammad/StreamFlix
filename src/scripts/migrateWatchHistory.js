const mongoose = require('mongoose');
const Subscription = require('../modules/subscriptions/models/Subscription');
const SubscriptionUsage = require(
    '../modules/subscriptions/models/SubscriptionUsage'
);
const subscriptionUsageService = require(
    '../modules/subscriptions/services/subscriptionUsage.service'
);
const {
    UUID_PATTERN,
    buildUsageBackfill,
    createLegacyViewSessionId,
    createViewKey,
    getHistoryEvents,
    normalizeViewSessionId
} = require(
    '../modules/subscriptions/services/subscriptionUsageBackfill'
);
const {
    SUBSCRIPTION_STATUS
} = require('../shared/constants/subscription-status.constant');
const WatchHistory = require(
    '../modules/watch-history/models/WatchHistory'
);
const ContentViewEvent = require(
    '../modules/watch-history/models/ContentViewEvent'
);

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const findDuplicateHistory = () => WatchHistory.aggregate([
    {
        $sort: {
            updatedAt: -1,
            _id: -1
        }
    },
    {
        $group: {
            _id: {
                profileId: '$profileId',
                contentId: '$contentId'
            },
            keepId: {
                $first: '$_id'
            },
            allIds: {
                $push: '$_id'
            },
            count: {
                $sum: 1
            }
        }
    },
    {
        $match: {
            count: {
                $gt: 1
            }
        }
    }
]);

const isSamePeriod = (usage, period) => Boolean(
    usage &&
    usage.periodStart &&
    usage.periodEnd &&
    new Date(usage.periodStart).getTime() === period.startDate.getTime() &&
    new Date(usage.periodEnd).getTime() === period.endDate.getTime()
);

const loadUsageBackfill = async(subscription, session = null) => {
    let usageQuery = SubscriptionUsage.findOne({
        subscriptionId: subscription._id
    });

    if (session) {
        usageQuery = usageQuery.session(session);
    }

    const existingUsage = await usageQuery.lean();
    const period = subscriptionUsageService.getCurrentUsagePeriod(
        subscription,
        existingUsage
    );
    const histories = await subscriptionUsageService
        .getUsageBackfillHistories(
            subscription.userId,
            period,
            session
        );
    const durableEvents = await subscriptionUsageService
        .getUsageBackfillViewEvents(
            subscription.userId,
            period,
            session
        );

    return {
        existingUsage,
        update: buildUsageBackfill(
            subscription,
            existingUsage,
            histories,
            period,
            durableEvents
        )
    };
};

const applyUsageBackfill = async(subscription, session = null) => {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const { existingUsage, update } = await loadUsageBackfill(
            subscription,
            session
        );

        if (!existingUsage) {
            try {
                const usage = new SubscriptionUsage({
                    subscriptionId: subscription._id,
                    ...update
                });

                return await usage.save(session ? { session } : undefined);
            } catch (error) {
                if (error && error.code === 11000) {
                    continue;
                }
                throw error;
            }
        }

        const versionFilter = existingUsage.updatedAt ?
            { updatedAt: existingUsage.updatedAt } :
            { updatedAt: { $exists: false } };
        let updateQuery = SubscriptionUsage.findOneAndUpdate(
            {
                _id: existingUsage._id,
                ...versionFilter
            },
            {
                $set: update
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (session) {
            updateQuery = updateQuery.session(session);
        }

        const updatedUsage = await updateQuery;

        if (updatedUsage) {
            return updatedUsage;
        }
    }

    throw new Error(
        `Usage changed repeatedly during migration for ${subscription._id}`
    );
};

const buildDurableViewEventBackfill = histories => {
    const eventsByKey = new Map();
    let orphanHistoryRows = 0;

    for (const history of histories) {
        const profile = history && history.profileId;
        const content = history && history.contentId;
        const profileId = profile && profile._id;
        const userId = profile && profile.userId;
        const contentId = content && content._id;
        const contentType = content && content.type;

        if (!profileId || !userId || !contentId || !contentType) {
            orphanHistoryRows += 1;
            continue;
        }

        for (const event of getHistoryEvents(history)) {
            const viewKey = createViewKey(
                profileId,
                contentId,
                event.viewSessionId
            );
            const existingEvent = eventsByKey.get(viewKey);

            if (
                existingEvent &&
                existingEvent.viewedAt.getTime() <= event.viewedAt.getTime()
            ) {
                continue;
            }

            eventsByKey.set(viewKey, {
                userId,
                profileId,
                contentId,
                contentType,
                subscriptionId: null,
                periodStart: null,
                periodEnd: null,
                viewSessionId: event.viewSessionId,
                viewedAt: event.viewedAt
            });
        }
    }

    return {
        events: [...eventsByKey.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([, event]) => event),
        orphanHistoryRows
    };
};

const loadAllHistoryEvidence = () => WatchHistory.find()
    .select('+viewEvents')
    .populate('profileId', 'userId')
    .populate('contentId', 'type')
    .lean();

const applyContentViewEventBackfill = async(histories = null) => {
    const historyRows = histories || await loadAllHistoryEvidence();
    const backfill = buildDurableViewEventBackfill(historyRows);

    if (backfill.events.length === 0) {
        return {
            ...backfill,
            upsertedEvents: 0
        };
    }

    const result = await ContentViewEvent.bulkWrite(
        backfill.events.map(event => ({
            updateOne: {
                filter: {
                    profileId: event.profileId,
                    contentId: event.contentId,
                    viewSessionId: event.viewSessionId
                },
                update: {
                    $setOnInsert: event
                },
                upsert: true
            }
        })),
        {
            ordered: false
        }
    );

    return {
        ...backfill,
        upsertedEvents: result.upsertedCount || 0
    };
};

const mergeHistoryEvidence = (histories, keepId) => {
    const keepHistory = histories.find(history =>
        history._id.toString() === keepId.toString()
    );

    if (!keepHistory) {
        throw new Error(`Watch History keeper ${keepId} was not found.`);
    }

    const eventsBySessionId = new Map();

    for (const history of histories) {
        for (const event of getHistoryEvents(history)) {
            const existingEvent = eventsBySessionId.get(event.viewSessionId);

            if (
                !existingEvent ||
                event.viewedAt.getTime() < existingEvent.viewedAt.getTime()
            ) {
                eventsBySessionId.set(event.viewSessionId, event);
            }
        }
    }

    const viewEvents = [...eventsBySessionId.values()].sort((left, right) => {
        const timeDifference =
            left.viewedAt.getTime() - right.viewedAt.getTime();

        return timeDifference ||
            left.viewSessionId.localeCompare(right.viewSessionId);
    });
    const keepSessionId = normalizeViewSessionId(
        keepHistory.viewSessionId
    );
    const viewSessionId = keepSessionId ||
        (
            viewEvents.length > 0 ?
                viewEvents[viewEvents.length - 1].viewSessionId :
                createLegacyViewSessionId(keepHistory._id)
        );
    const viewSessionIds = [
        ...new Set([
            ...viewEvents.map(event => event.viewSessionId),
            viewSessionId
        ])
    ];

    return {
        viewSessionId,
        viewSessionIds,
        viewEvents
    };
};

const mergeDuplicateHistoryGroup = async group => {
    const histories = await WatchHistory.find({
        _id: {
            $in: group.allIds
        }
    })
        .select('+viewEvents')
        .lean();
    const mergedEvidence = mergeHistoryEvidence(histories, group.keepId);
    const loserIds = group.allIds.filter(id =>
        id.toString() !== group.keepId.toString()
    );

    await WatchHistory.updateOne(
        {
            _id: group.keepId
        },
        {
            $set: mergedEvidence
        },
        {
            runValidators: true,
            timestamps: false
        }
    );

    if (loserIds.length > 0) {
        await WatchHistory.deleteMany({
            _id: {
                $in: loserIds
            }
        });
    }

    return {
        keepId: group.keepId,
        removedIds: loserIds,
        ...mergedEvidence
    };
};

const runMigration = async({
    apply = false,
    maintenanceWindowConfirmed = false
} = {}) => {
    if (apply && !maintenanceWindowConfirmed) {
        throw new Error(
            'Apply mode requires --maintenance-window-confirmed with viewing writes paused.'
        );
    }

    const duplicateGroups = await findDuplicateHistory();
    const duplicateIds = duplicateGroups.flatMap(group =>
        group.allIds
            .filter(id => id.toString() !== group.keepId.toString())
    );
    const retentionCutoff = new Date(Date.now() - ONE_YEAR_SECONDS * 1000);
    const expiredHistoryCount = await WatchHistory.countDocuments({
        updatedAt: {
            $lte: retentionCutoff
        }
    });
    const historiesNeedingViewSessionId = await WatchHistory.find({
        $or: [
            {
                viewSessionId: null
            },
            {
                viewSessionId: {
                    $exists: false
                }
            },
            {
                viewSessionId: {
                    $not: UUID_PATTERN
                }
            }
        ]
    }).select('_id').lean();
    const allHistoryEvidence = await loadAllHistoryEvidence();
    const durableViewEventPlan = buildDurableViewEventBackfill(
        allHistoryEvidence
    );
    const activeSubscriptions = await Subscription.find({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: {
            $gt: new Date()
        }
    })
        .populate('planId')
        .lean();

    const activeSubscriptionsByUser = new Map();

    for (const subscription of activeSubscriptions) {
        const userKey = subscription.userId.toString();
        activeSubscriptionsByUser.set(
            userKey,
            (activeSubscriptionsByUser.get(userKey) || 0) + 1
        );
    }

    const conflictingActiveAccounts = [...activeSubscriptionsByUser.values()]
        .filter(count => count > 1)
        .length;
    const usageBackfills = [];

    for (const subscription of activeSubscriptions) {
        usageBackfills.push(await loadUsageBackfill(subscription));
    }

    const unattributedLegacyUsageRowsIgnored = usageBackfills.filter(item =>
        item.existingUsage &&
        (
            item.existingUsage.moviesUsedCount > 0 ||
            item.existingUsage.seriesUsedCount > 0
        ) &&
        !isSamePeriod(item.existingUsage, {
            startDate: new Date(item.update.periodStart),
            endDate: new Date(item.update.periodEnd)
        })
    ).length;

    const report = {
        mode: apply ? 'apply' : 'dry-run',
        duplicateHistoryGroups: duplicateGroups.length,
        duplicateHistoryRowsToRemove: duplicateIds.length,
        historyRowsAtOrBeyondRetention: expiredHistoryCount,
        historyRowsMissingOrInvalidViewSessionId:
            historiesNeedingViewSessionId.length,
        durableViewEventsDiscovered: durableViewEventPlan.events.length,
        orphanHistoryRowsSkipped: durableViewEventPlan.orphanHistoryRows,
        activeSubscriptionUsageRowsToBackfill: activeSubscriptions.length,
        conflictingActiveAccounts,
        unattributedLegacyUsageRowsIgnored
    };

    if (!apply) {
        return report;
    }

    if (conflictingActiveAccounts > 0) {
        throw new Error(
            'Resolve accounts with multiple active subscriptions before applying.'
        );
    }

    if (durableViewEventPlan.orphanHistoryRows > 0) {
        throw new Error(
            'Resolve orphan Watch History rows before applying the migration.'
        );
    }

    await ContentViewEvent.createIndexes();
    const durableViewEventBackfill = await applyContentViewEventBackfill(
        allHistoryEvidence
    );

    for (const subscription of activeSubscriptions) {
        await applyUsageBackfill(subscription);
    }

    for (const group of duplicateGroups) {
        await mergeDuplicateHistoryGroup(group);
    }

    const currentHistoriesNeedingViewSessionId = await WatchHistory.find({
        $or: [
            {
                viewSessionId: null
            },
            {
                viewSessionId: {
                    $exists: false
                }
            },
            {
                viewSessionId: {
                    $not: UUID_PATTERN
                }
            }
        ]
    }).select('_id').lean();

    if (currentHistoriesNeedingViewSessionId.length > 0) {
        await WatchHistory.bulkWrite(
            currentHistoriesNeedingViewSessionId.map(history => ({
                updateOne: {
                    filter: {
                        _id: history._id
                    },
                    update: {
                        $set: {
                            viewSessionId: createLegacyViewSessionId(
                                history._id
                            )
                        }
                    },
                    timestamps: false
                }
            })),
            {
                timestamps: false
            }
        );
    }

    await WatchHistory.updateMany(
        {
            viewSessionId: {
                $type: 'string'
            }
        },
        [
            {
                $set: {
                    viewSessionId: {
                        $toLower: '$viewSessionId'
                    },
                    viewSessionIds: {
                        $setUnion: [
                            {
                                $map: {
                                    input: {
                                        $ifNull: ['$viewSessionIds', []]
                                    },
                                    as: 'sessionId',
                                    in: {
                                        $toLower: '$$sessionId'
                                    }
                                }
                            },
                            [
                                {
                                    $toLower: '$viewSessionId'
                                }
                            ]
                        ]
                    }
                }
            }
        ],
        {
            timestamps: false
        }
    );

    await WatchHistory.collection.createIndex(
        {
            profileId: 1,
            contentId: 1
        },
        {
            unique: true,
            name: 'unique_profile_content_history'
        }
    );
    await WatchHistory.collection.createIndex(
        {
            updatedAt: 1
        },
        {
            expireAfterSeconds: ONE_YEAR_SECONDS,
            name: 'watch_history_one_year_retention'
        }
    );
    await WatchHistory.collection.createIndex(
        {
            profileId: 1,
            updatedAt: -1
        }
    );

    report.durableViewEventsUpserted =
        durableViewEventBackfill.upsertedEvents;

    return report;
};

const main = async() => {
    require('dotenv').config();
    const apply = process.argv.includes('--apply');
    const maintenanceWindowConfirmed = process.argv.includes(
        '--maintenance-window-confirmed'
    );

    if (!process.env.MONGOOSE_URL) {
        throw new Error('MONGOOSE_URL is required');
    }

    await mongoose.connect(process.env.MONGOOSE_URL, {
        autoIndex: false
    });

    try {
        const report = await runMigration({
            apply,
            maintenanceWindowConfirmed
        });
        console.log(JSON.stringify(report, null, 2));
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = {
    applyContentViewEventBackfill,
    applyUsageBackfill,
    buildDurableViewEventBackfill,
    buildUsageBackfill,
    createLegacyViewSessionId,
    findDuplicateHistory,
    isSamePeriod,
    loadAllHistoryEvidence,
    loadUsageBackfill,
    mergeDuplicateHistoryGroup,
    mergeHistoryEvidence,
    runMigration
};

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const WatchHistory = require('../modules/watch-history/models/WatchHistory');
const Subscription = require('../modules/subscriptions/models/Subscription');
const SubscriptionUsage = require('../modules/subscriptions/models/SubscriptionUsage');
const Profile = require('../modules/profiles/models/Profile');
const Content = require('../modules/content/models/Content');
const { SUBSCRIPTION_STATUS } = require('../shared/constants/subscription-status.constant');
const { CONTENT_TYPE } = require('../shared/constants/content-type.constant');

const applyChanges = process.argv.includes('--apply');
const batchSize = 500;

const toIdString = (id) => new mongoose.Types.ObjectId(id).toHexString();

const buildConsumptionKey = (profileId, contentId) => {
    return `${toIdString(profileId)}:${toIdString(contentId)}`;
};

const preserveRecordedUsage = (recorded, reconstructed) => {
    const numericRecorded = Number(recorded || 0);
    const safeRecorded = Number.isFinite(numericRecorded) &&
        numericRecorded > 0 ? numericRecorded : 0;

    return Math.max(safeRecorded, reconstructed);
};

const chunk = (items, size) => {
    const chunks = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
};

const isExpiredByDate = (subscription, now) => {
    const endDate = new Date(subscription.endDate);
    return !Number.isNaN(endDate.getTime()) && endDate <= now;
};

const isCurrentSubscription = (subscription, now) => {
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);

    return !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate <= now &&
        endDate > now;
};

const inspectActiveSubscriptions = async(now) => {
    const activeSubscriptions = await Subscription.find({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        userId: { $type: 'objectId' }
    })
        .select('_id userId startDate endDate usage')
        .lean();

    const expired = activeSubscriptions.filter((subscription) => {
        return isExpiredByDate(subscription, now);
    });
    const nonExpiredByUser = new Map();

    for (const subscription of activeSubscriptions) {
        if (isExpiredByDate(subscription, now)) {
            continue;
        }

        const userId = subscription.userId.toString();
        const subscriptions = nonExpiredByUser.get(userId) || [];
        subscriptions.push(subscription);
        nonExpiredByUser.set(userId, subscriptions);
    }

    const conflicts = [...nonExpiredByUser.entries()]
        .filter(([, subscriptions]) => subscriptions.length > 1)
        .map(([userId, subscriptions]) => ({
            userId,
            subscriptionIds: subscriptions.map((subscription) => subscription._id.toString())
        }));

    const current = activeSubscriptions.filter((subscription) => {
        return isCurrentSubscription(subscription, now);
    });
    const currentCountByUser = new Map();

    for (const subscription of current) {
        const userId = subscription.userId.toString();
        currentCountByUser.set(userId, (currentCountByUser.get(userId) || 0) + 1);
    }

    const currentDuplicateAccounts = [...currentCountByUser.values()]
        .filter((count) => count > 1)
        .length;

    return {
        activeSubscriptions,
        expired,
        conflicts,
        current,
        currentDuplicateAccounts
    };
};

const getDuplicateStats = async(Model, groupFields) => {
    const groupId = Object.fromEntries(
        groupFields.map((field) => [field, `$${field}`])
    );
    const [stats] = await Model.aggregate([
        {
            $group: {
                _id: groupId,
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        },
        {
            $group: {
                _id: null,
                groups: { $sum: 1 },
                redundantRows: { $sum: { $subtract: ['$count', 1] } }
            }
        }
    ]).allowDiskUse(true);

    return {
        groups: stats?.groups || 0,
        redundantRows: stats?.redundantRows || 0
    };
};

const deduplicateWatchHistory = async() => {
    let groups = 0;
    let deletedRows = 0;
    const duplicateGroups = WatchHistory.aggregate([
        {
            $group: {
                _id: {
                    profileId: '$profileId',
                    contentId: '$contentId'
                },
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ])
        .allowDiskUse(true)
        .cursor({ batchSize: 100 });

    for await (const duplicateGroup of duplicateGroups) {
        const rows = await WatchHistory.find({
            profileId: duplicateGroup._id.profileId,
            contentId: duplicateGroup._id.contentId
        })
            .select('_id')
            .sort({ updatedAt: -1, watchedAt: -1, createdAt: -1, _id: -1 })
            .lean();
        const redundantIds = rows.slice(1).map((row) => row._id);

        groups += 1;

        for (const ids of chunk(redundantIds, batchSize)) {
            const result = await WatchHistory.deleteMany({ _id: { $in: ids } });
            deletedRows += result.deletedCount;
        }
    }

    return { groups, deletedRows };
};

const deduplicateSubscriptionUsage = async() => {
    let groups = 0;
    let deletedRows = 0;
    const duplicateGroups = SubscriptionUsage.aggregate([
        {
            $group: {
                _id: {
                    subscriptionId: '$subscriptionId',
                    periodStart: '$periodStart',
                    profileId: '$profileId',
                    contentId: '$contentId'
                },
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ])
        .allowDiskUse(true)
        .cursor({ batchSize: 100 });

    for await (const duplicateGroup of duplicateGroups) {
        const rows = await SubscriptionUsage.find({
            subscriptionId: duplicateGroup._id.subscriptionId,
            periodStart: duplicateGroup._id.periodStart,
            profileId: duplicateGroup._id.profileId,
            contentId: duplicateGroup._id.contentId
        })
            .select('_id')
            .sort({ createdAt: 1, _id: 1 })
            .lean();
        const redundantIds = rows.slice(1).map((row) => row._id);

        groups += 1;

        for (const ids of chunk(redundantIds, batchSize)) {
            const result = await SubscriptionUsage.deleteMany({ _id: { $in: ids } });
            deletedRows += result.deletedCount;
        }
    }

    return { groups, deletedRows };
};

const getHistoryUsageEvents = async(subscription, now) => {
    const profileIds = await Profile.distinct('_id', {
        userId: subscription.userId
    });

    if (profileIds.length === 0) {
        return [];
    }

    const periodEnd = new Date(subscription.endDate);
    const upperBound = periodEnd < now ? periodEnd : now;

    return WatchHistory.aggregate([
        {
            $match: {
                profileId: { $in: profileIds },
                createdAt: {
                    $gte: new Date(subscription.startDate),
                    $lt: upperBound
                }
            }
        },
        {
            $group: {
                _id: {
                    profileId: '$profileId',
                    contentId: '$contentId'
                },
                viewedAt: { $min: '$createdAt' }
            }
        },
        {
            $lookup: {
                from: Content.collection.name,
                localField: '_id.contentId',
                foreignField: '_id',
                as: 'content'
            }
        },
        {
            $unwind: '$content'
        },
        {
            $match: {
                'content.type': {
                    $in: [CONTENT_TYPE.MOVIE, CONTENT_TYPE.SERIES]
                }
            }
        },
        {
            $project: {
                _id: 0,
                profileId: '$_id.profileId',
                contentId: '$_id.contentId',
                contentType: '$content.type',
                viewedAt: 1
            }
        }
    ]).allowDiskUse(true);
};

const mapUsageByConsumptionKey = (usageRows) => {
    const usageByKey = new Map();

    for (const usage of usageRows) {
        const key = buildConsumptionKey(usage.profileId, usage.contentId);

        if (!usageByKey.has(key)) {
            usageByKey.set(key, usage);
        }
    }

    return usageByKey;
};

const upsertHistoryUsageEvents = async(subscription, historyEvents) => {
    let upsertedCount = 0;
    const periodStart = new Date(subscription.startDate);

    for (const events of chunk(historyEvents, batchSize)) {
        const operations = events.map((event) => ({
            updateOne: {
                filter: {
                    subscriptionId: subscription._id,
                    periodStart,
                    profileId: event.profileId,
                    contentId: event.contentId
                },
                update: {
                    $setOnInsert: {
                        userId: subscription.userId,
                        subscriptionId: subscription._id,
                        profileId: event.profileId,
                        contentId: event.contentId,
                        contentType: event.contentType,
                        periodStart,
                        createdAt: event.viewedAt,
                        updatedAt: event.viewedAt
                    }
                },
                upsert: true
            }
        }));
        const result = await SubscriptionUsage.bulkWrite(
            operations,
            { ordered: false, timestamps: false }
        );

        upsertedCount += result.upsertedCount;
    }

    return upsertedCount;
};

const reconcileSubscriptionUsage = async(subscription, now) => {
    const periodStart = new Date(subscription.startDate);
    const existingMovieCounter = subscription.usage?.movies;
    const existingSeriesCounter = subscription.usage?.series;
    const historyEvents = await getHistoryUsageEvents(subscription, now);
    const existingUsage = await SubscriptionUsage.find({
        subscriptionId: subscription._id,
        periodStart
    })
        .select('profileId contentId contentType')
        .lean();
    const existingUsageByKey = mapUsageByConsumptionKey(existingUsage);
    const predictedUsage = mapUsageByConsumptionKey([
        ...existingUsage,
        ...historyEvents
    ]);

    if (!applyChanges) {
        const ledgerMovies = [...predictedUsage.values()]
            .filter((usage) => usage.contentType === CONTENT_TYPE.MOVIE)
            .length;
        const ledgerSeries = [...predictedUsage.values()]
            .filter((usage) => usage.contentType === CONTENT_TYPE.SERIES)
            .length;
        const movies = preserveRecordedUsage(
            existingMovieCounter,
            ledgerMovies
        );
        const series = preserveRecordedUsage(
            existingSeriesCounter,
            ledgerSeries
        );

        return {
            historyEvents: historyEvents.length,
            ledgerRowsAdded: Math.max(0, predictedUsage.size - existingUsageByKey.size),
            movies,
            series,
            unattributedMovies: movies - ledgerMovies,
            unattributedSeries: series - ledgerSeries
        };
    }

    const ledgerRowsAdded = await upsertHistoryUsageEvents(subscription, historyEvents);
    const authoritativeUsage = await SubscriptionUsage.find({
        subscriptionId: subscription._id,
        periodStart
    })
        .select('profileId contentId contentType')
        .lean();
    const usageByKey = mapUsageByConsumptionKey(authoritativeUsage);
    const usageValues = [...usageByKey.values()];
    const ledgerMovies = usageValues
        .filter((usage) => usage.contentType === CONTENT_TYPE.MOVIE)
        .length;
    const ledgerSeries = usageValues
        .filter((usage) => usage.contentType === CONTENT_TYPE.SERIES)
        .length;
    // Deleted profiles/history cannot be reconstructed. Never restore allowance
    // by lowering a counter that already recorded greater current-period usage.
    const movies = preserveRecordedUsage(existingMovieCounter, ledgerMovies);
    const series = preserveRecordedUsage(existingSeriesCounter, ledgerSeries);

    await Subscription.updateOne(
        { _id: subscription._id },
        {
            $set: {
                'usage.movies': movies,
                'usage.series': series,
                // These keys are short-lived non-transactional reservations. The
                // immutable usage ledger is the durable current-period source.
                consumedViewKeys: []
            }
        }
    );

    return {
        historyEvents: historyEvents.length,
        ledgerRowsAdded,
        movies,
        series,
        unattributedMovies: movies - ledgerMovies,
        unattributedSeries: series - ledgerSeries
    };
};

const reconcileCurrentSubscriptions = async(currentSubscriptions, now) => {
    const totals = {
        accounts: 0,
        historyEvents: 0,
        ledgerRowsAdded: 0,
        movies: 0,
        series: 0,
        unattributedMovies: 0,
        unattributedSeries: 0
    };

    for (const subscription of currentSubscriptions) {
        const result = await reconcileSubscriptionUsage(subscription, now);

        totals.accounts += 1;
        totals.historyEvents += result.historyEvents;
        totals.ledgerRowsAdded += result.ledgerRowsAdded;
        totals.movies += result.movies;
        totals.series += result.series;
        totals.unattributedMovies += result.unattributedMovies;
        totals.unattributedSeries += result.unattributedSeries;
    }

    return totals;
};

const assertIndexesAreSafe = async(now) => {
    const activeInspection = await inspectActiveSubscriptions(now);
    const historyDuplicates = await getDuplicateStats(
        WatchHistory,
        ['profileId', 'contentId']
    );
    const usageDuplicates = await getDuplicateStats(
        SubscriptionUsage,
        ['subscriptionId', 'periodStart', 'profileId', 'contentId']
    );

    if (
        activeInspection.expired.length > 0 ||
        activeInspection.conflicts.length > 0 ||
        historyDuplicates.groups > 0 ||
        usageDuplicates.groups > 0
    ) {
        throw new Error('Data changed during migration; indexes were not created');
    }
};

const createFeatureIndexes = async() => {
    const created = {};

    created.WatchHistory = await WatchHistory.createIndexes();
    created.SubscriptionUsage = await SubscriptionUsage.createIndexes();
    created.Subscription = await Subscription.createIndexes();

    return created;
};

const migrate = async() => {
    if (!process.env.MONGOOSE_URL) {
        throw new Error('MONGOOSE_URL is required');
    }

    await mongoose.connect(process.env.MONGOOSE_URL, { autoIndex: false });

    const now = new Date();
    const activeInspection = await inspectActiveSubscriptions(now);
    const historyDuplicates = await getDuplicateStats(
        WatchHistory,
        ['profileId', 'contentId']
    );
    const usageDuplicates = await getDuplicateStats(
        SubscriptionUsage,
        ['subscriptionId', 'periodStart', 'profileId', 'contentId']
    );

    console.log(`[migration] mode=${applyChanges ? 'apply' : 'dry-run'}`);
    console.log(
        `[subscriptions] current=${activeInspection.current.length} ` +
        `expired-active=${activeInspection.expired.length} ` +
        `current-conflict-accounts=${activeInspection.currentDuplicateAccounts} ` +
        `active-index-conflict-accounts=${activeInspection.conflicts.length}`
    );
    console.log(
        `[watch-history] duplicate-groups=${historyDuplicates.groups} ` +
        `redundant-rows=${historyDuplicates.redundantRows}`
    );
    console.log(
        `[usage-ledger] duplicate-groups=${usageDuplicates.groups} ` +
        `redundant-rows=${usageDuplicates.redundantRows}`
    );

    if (activeInspection.conflicts.length > 0) {
        for (const conflict of activeInspection.conflicts) {
            console.error(
                `[blocked] user=${conflict.userId} active-subscriptions=` +
                conflict.subscriptionIds.join(',')
            );
        }

        if (applyChanges) {
            throw new Error(
                'Active subscription conflicts require manual resolution; no changes were applied'
            );
        }
    }

    if (!applyChanges) {
        const usagePreview = await reconcileCurrentSubscriptions(
            activeInspection.current,
            now
        );

        console.log(
            `[usage] accounts=${usagePreview.accounts} ` +
            `history-events=${usagePreview.historyEvents} ` +
            `ledger-upserts-needed=${usagePreview.ledgerRowsAdded} ` +
            `movies=${usagePreview.movies} series=${usagePreview.series} ` +
            `unattributed-movies=${usagePreview.unattributedMovies} ` +
            `unattributed-series=${usagePreview.unattributedSeries}`
        );
        console.log(
            '[migration] dry-run complete; rerun with --apply during a viewing-write maintenance window'
        );
        return;
    }

    if (activeInspection.expired.length > 0) {
        const expiredResult = await Subscription.updateMany(
            { _id: { $in: activeInspection.expired.map((subscription) => subscription._id) } },
            {
                $set: {
                    status: SUBSCRIPTION_STATUS.EXPIRED,
                    autoRenew: false
                }
            }
        );
        console.log(`[subscriptions] expired-active-cleaned=${expiredResult.modifiedCount}`);
    }

    const historyCleanup = await deduplicateWatchHistory();
    const usageCleanup = await deduplicateSubscriptionUsage();

    console.log(
        `[watch-history] deduplicated-groups=${historyCleanup.groups} ` +
        `deleted=${historyCleanup.deletedRows}`
    );
    console.log(
        `[usage-ledger] deduplicated-groups=${usageCleanup.groups} ` +
        `deleted=${usageCleanup.deletedRows}`
    );

    // Reconcile again after deterministic duplicate cleanup so counters mirror
    // the exact ledger that will be protected by the unique index.
    const refreshedInspection = await inspectActiveSubscriptions(now);
    const usageResult = await reconcileCurrentSubscriptions(
        refreshedInspection.current,
        now
    );

    console.log(
        `[usage] reconciled-accounts=${usageResult.accounts} ` +
        `ledger-upserts=${usageResult.ledgerRowsAdded} ` +
        `preserved-unattributed-movies=${usageResult.unattributedMovies} ` +
        `preserved-unattributed-series=${usageResult.unattributedSeries}`
    );

    await assertIndexesAreSafe(now);
    const createdIndexes = await createFeatureIndexes();

    console.log(`[indexes] created=${JSON.stringify(createdIndexes)}`);
    console.log('[migration] apply complete');
};

if (require.main === module) {
    migrate()
        .catch((error) => {
            console.error(`[migration] failed: ${error.message}`);
            process.exitCode = 1;
        })
        .finally(async() => {
            await mongoose.disconnect();
        });
}

module.exports = {
    migrate,
    inspectActiveSubscriptions,
    getDuplicateStats,
    buildConsumptionKey,
    preserveRecordedUsage
};

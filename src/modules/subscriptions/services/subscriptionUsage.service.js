const SubscriptionUsage = require('../models/SubscriptionUsage');
const Subscription = require('../models/Subscription');
const AppError = require('../../../shared/errors/AppError');
const {
    CONTENT_TYPE
} = require('../../../shared/constants/content-type.constant');
const {
    SUBSCRIPTION_STATUS
} = require('../../../shared/constants/subscription-status.constant');
const {
    buildUsageBackfill,
    createUsageHistoryFilter,
    createViewKey,
    hasLegacyRawViewKeys
} = require('./subscriptionUsageBackfill');

class SubscriptionUsageService {
    async getActiveSubscriptionForUsage(userId, session = null) {
        const now = new Date();
        let query = Subscription.find({
            userId,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            endDate: {
                $gt: now
            }
        })
            .sort({
                endDate: -1,
                startDate: -1,
                _id: -1
            })
            .limit(2)
            .populate('planId');

        if (session) {
            query = query.session(session);
        }

        const subscriptions = await query;

        if (subscriptions.length === 0) {
            throw new AppError(
                'You do not have an active subscription.',
                403
            );
        }

        if (subscriptions.length > 1) {
            throw new AppError(
                'Multiple active subscriptions were found for this account.',
                409
            );
        }

        const [subscription] = subscriptions;

        if (!subscription.planId) {
            throw new AppError(
                'The active subscription plan was not found.',
                404
            );
        }

        return subscription;
    }

    getCurrentUsagePeriod(subscription, usage = null, now = new Date()) {
        const subscriptionStart = new Date(subscription.startDate);
        const subscriptionEnd = new Date(subscription.endDate);
        const storedStart = usage && usage.periodStart ?
            new Date(usage.periodStart) :
            null;
        const storedEnd = usage && usage.periodEnd ?
            new Date(usage.periodEnd) :
            null;

        if (
            subscriptionStart > now &&
            storedStart &&
            storedEnd &&
            storedStart <= now &&
            now < storedEnd &&
            storedEnd <= subscriptionStart
        ) {
            return {
                startDate: storedStart,
                endDate: storedEnd
            };
        }

        if (subscriptionStart <= now) {
            return {
                startDate: subscriptionStart,
                endDate: subscriptionEnd
            };
        }

        const durationDays = Number(
            subscription.planId && subscription.planId.duration
        );

        if (!Number.isFinite(durationDays) || durationDays < 1) {
            throw new AppError(
                'The active subscription period could not be determined.',
                409
            );
        }

        let periodEnd = new Date(subscriptionStart);
        let periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - durationDays);

        while (periodStart > now) {
            periodEnd = new Date(periodStart);
            periodStart.setDate(periodStart.getDate() - durationDays);
        }

        return {
            startDate: periodStart,
            endDate: periodEnd
        };
    }

    async getUsageBackfillHistories(userId, period, session = null) {
        const WatchHistory = require('../../watch-history/models/WatchHistory');
        const Profile = require('../../profiles/models/Profile');

        let profilesQuery = Profile.find({
            userId
        }).select('_id');

        if (session) {
            profilesQuery = profilesQuery.session(session);
        }

        const profiles = await profilesQuery.lean();
        const profileIds = profiles.map(profile => profile._id);

        if (profileIds.length === 0) {
            return [];
        }

        let historiesQuery = WatchHistory.find(
            createUsageHistoryFilter(profileIds, period)
        )
            .select('+viewEvents')
            .populate('contentId', 'type');

        if (session) {
            historiesQuery = historiesQuery.session(session);
        }

        return historiesQuery.lean();
    }

    async getUsageBackfillViewEvents(userId, period, session = null) {
        const ContentViewEvent = require(
            '../../watch-history/models/ContentViewEvent'
        );
        let eventsQuery = ContentViewEvent.find({
            userId,
            viewedAt: {
                $gte: period.startDate,
                $lt: period.endDate
            }
        }).select(
            'profileId contentId contentType viewSessionId viewedAt'
        );

        if (session) {
            eventsQuery = eventsQuery.session(session);
        }

        return eventsQuery.lean();
    }

    async ensureUsageForCurrentPeriod(
        userId,
        subscription,
        session = null
    ) {
        let query = SubscriptionUsage.findOne({
            subscriptionId: subscription._id
        });

        if (session) {
            query = query.session(session);
        }

        let usage = await query;
        let currentPeriod = this.getCurrentUsagePeriod(subscription, usage);

        if (!usage || hasLegacyRawViewKeys(usage)) {
            const oldHistories = await this.getUsageBackfillHistories(
                userId,
                currentPeriod,
                session
            );
            const durableEvents = await this.getUsageBackfillViewEvents(
                userId,
                currentPeriod,
                session
            );
            const backfill = buildUsageBackfill(
                subscription,
                usage,
                oldHistories,
                currentPeriod,
                durableEvents
            );

            if (!usage) {
                usage = new SubscriptionUsage({
                    subscriptionId: subscription._id,
                    ...backfill
                });

                try {
                    await usage.save(session ? { session } : undefined);
                } catch (error) {
                    if (error && error.code === 11000) {
                        let existingQuery = SubscriptionUsage.findOne({
                            subscriptionId: subscription._id
                        });
                        if (session) {
                            existingQuery = existingQuery.session(session);
                        }
                        usage = await existingQuery;
                        currentPeriod = this.getCurrentUsagePeriod(
                            subscription,
                            usage
                        );
                    } else {
                        throw error;
                    }
                }
            } else {
                const normalizationFilter = {
                    _id: usage._id,
                    periodStart: usage.periodStart || null
                };
                let normalizationQuery = SubscriptionUsage.findOneAndUpdate(
                    normalizationFilter,
                    {
                        $set: backfill
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                if (session) {
                    normalizationQuery = normalizationQuery.session(session);
                }

                const normalizedUsage = await normalizationQuery;

                if (normalizedUsage) {
                    usage = normalizedUsage;
                } else {
                    let currentQuery = SubscriptionUsage.findById(usage._id);

                    if (session) {
                        currentQuery = currentQuery.session(session);
                    }

                    usage = await currentQuery;
                }
            }
        }

        if (!usage || usage.userId.toString() !== userId.toString()) {
            throw new AppError(
                'Subscription usage does not belong to this account.',
                403
            );
        }

        const storedPeriodStart = usage.periodStart ?
            new Date(usage.periodStart).getTime() :
            null;
        const activePeriodStart = currentPeriod.startDate.getTime();

        if (storedPeriodStart !== activePeriodStart) {
            let resetQuery = SubscriptionUsage.findOneAndUpdate(
                {
                    _id: usage._id,
                    periodStart: usage.periodStart || null
                },
                {
                    $set: {
                        periodStart: currentPeriod.startDate,
                        periodEnd: currentPeriod.endDate,
                        moviesUsedCount: 0,
                        seriesUsedCount: 0,
                        movieViewKeys: [],
                        seriesViewKeys: []
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (session) {
                resetQuery = resetQuery.session(session);
            }

            const resetUsage = await resetQuery;

            if (resetUsage) {
                usage = resetUsage;
            } else {
                let currentQuery = SubscriptionUsage.findById(usage._id);
                if (session) {
                    currentQuery = currentQuery.session(session);
                }
                usage = await currentQuery;
            }

            if (
                !usage ||
                !usage.periodStart ||
                new Date(usage.periodStart).getTime() !== activePeriodStart
            ) {
                throw new AppError(
                    'Subscription usage period could not be initialized.',
                    409
                );
            }
        } else if (
            !usage.periodEnd ||
            new Date(usage.periodEnd).getTime() !==
                currentPeriod.endDate.getTime()
        ) {
            usage.periodEnd = currentPeriod.endDate;
            await usage.save(session ? { session } : undefined);
        }

        return usage;
    }

    async consumeNewView({
        userId,
        profileId,
        contentId,
        contentType,
        viewSessionId,
        session = null
    }) {
        const normalizedViewSessionId = typeof viewSessionId === 'string' ?
            viewSessionId.trim().toLowerCase() :
            '';

        if (!normalizedViewSessionId) {
            throw new AppError('View session ID is required.', 400);
        }

        const subscription = await this.getActiveSubscriptionForUsage(
            userId,
            session
        );
        const plan = subscription.planId;
        const usage = await this.ensureUsageForCurrentPeriod(
            userId,
            subscription,
            session
        );

        let countField;
        let viewKeysField;
        let planLimit;
        let contentLabel;

        if (contentType === CONTENT_TYPE.MOVIE) {
            countField = 'moviesUsedCount';
            viewKeysField = 'movieViewKeys';
            planLimit = Number(plan.maxMovies);
            contentLabel = 'movie';
        } else if (contentType === CONTENT_TYPE.SERIES) {
            countField = 'seriesUsedCount';
            viewKeysField = 'seriesViewKeys';
            planLimit = Number(plan.maxSeries);
            contentLabel = 'series';
        } else {
            throw new AppError('Unsupported content type.', 400);
        }

        const viewKey = createViewKey(
            profileId,
            contentId,
            normalizedViewSessionId
        );
        const viewKeys = usage[viewKeysField] || [];

        if (viewKeys.includes(viewKey)) {
            return {
                consumed: false,
                alreadyConsumed: true,
                subscription,
                usage
            };
        }

        if (plan.isLimited && usage[countField] >= planLimit) {
            throw new AppError(
                `لقد استنفدت الحد الأقصى المسموح به من الـ ${contentLabel} في باقتك.`,
                403
            );
        }

        const updateFilter = {
            _id: usage._id,
            [viewKeysField]: {
                $ne: viewKey
            }
        };

        if (plan.isLimited) {
            updateFilter[countField] = {
                $lt: planLimit
            };
        }

        const update = {
            $addToSet: {
                [viewKeysField]: viewKey
            },
            $inc: {
                [countField]: 1
            },
            $set: {
                periodStart: usage.periodStart,
                periodEnd: usage.periodEnd
            }
        };

        let updateQuery = SubscriptionUsage.findOneAndUpdate(
            updateFilter,
            update,
            {
                new: true,
                runValidators: true
            }
        );

        if (session) {
            updateQuery = updateQuery.session(session);
        }

        const updatedUsage = await updateQuery;

        if (!updatedUsage) {
            let currentQuery = SubscriptionUsage.findById(usage._id);
            if (session) {
                currentQuery = currentQuery.session(session);
            }
            const currentUsage = await currentQuery;
            const currentViewKeys = currentUsage ?
                currentUsage[viewKeysField] || [] :
                [];

            if (currentViewKeys.includes(viewKey)) {
                return {
                    consumed: false,
                    alreadyConsumed: true,
                    subscription,
                    usage: currentUsage
                };
            }

            if (
                plan.isLimited &&
                currentUsage &&
                currentUsage[countField] >= planLimit
            ) {
                throw new AppError(
                    `لقد استنفدت الحد الأقصى المسموح به من الـ ${contentLabel} في باقتك.`,
                    403
                );
            }

            throw new AppError(
                'Unable to record subscription usage.',
                409
            );
        }

        return {
            consumed: true,
            alreadyConsumed: false,
            subscription,
            usage: updatedUsage
        };
    }

    async getUsageSummary(userId) {
        const subscription = await this.getActiveSubscriptionForUsage(userId);
        const plan = subscription.planId;
        const usage = await this.ensureUsageForCurrentPeriod(
            userId,
            subscription
        );
        const currentPeriod = this.getCurrentUsagePeriod(
            subscription,
            usage
        );
        const isCurrentPeriod = usage &&
            usage.periodStart &&
            usage.periodEnd &&
            new Date(usage.periodStart).getTime() ===
                currentPeriod.startDate.getTime() &&
            new Date(usage.periodEnd).getTime() ===
                currentPeriod.endDate.getTime();
        const moviesConsumed = isCurrentPeriod ?
            usage.moviesUsedCount :
            0;
        const seriesConsumed = isCurrentPeriod ?
            usage.seriesUsedCount :
            0;

        return {
            consumed: {
                movies: moviesConsumed,
                series: seriesConsumed
            },
            remaining: {
                movies: plan.isLimited ?
                    Math.max(Number(plan.maxMovies) - moviesConsumed, 0) :
                    null,
                series: plan.isLimited ?
                    Math.max(Number(plan.maxSeries) - seriesConsumed, 0) :
                    null
            },
            plan: {
                isLimited: plan.isLimited,
                maxMovies: plan.isLimited ?
                    Number(plan.maxMovies) :
                    null,
                maxSeries: plan.isLimited ?
                    Number(plan.maxSeries) :
                    null,
                maxProfiles: plan.maxProfiles,
                maxDevices: plan.maxDevices,
                quality: plan.quality
            },
            subscriptionPeriod: {
                startDate: currentPeriod.startDate,
                endDate: currentPeriod.endDate
            }
        };
    }
}

module.exports = new SubscriptionUsageService();

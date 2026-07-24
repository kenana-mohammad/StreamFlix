const mongoose = require("mongoose");
const Subscription = require("../models/Subscription");
const SubscriptionUsage = require("../models/SubscriptionUsage");
const AppError = require("../../../shared/errors/AppError");
const { CONTENT_TYPE } = require("../../../shared/constants/content-type.constant");
const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");

const subscriptionService = require("./subscription.service");

class SubscriptionUsageService {
    _withSession(query, session) {
        return session ? query.session(session) : query;
    }

    _getUsageConfig(contentType) {
        if (contentType === CONTENT_TYPE.MOVIE) {
            return {
                usageField: "usage.movies",
                usageKey: "movies",
                limitField: "maxMovies",
                label: "Movie"
            };
        }

        if (contentType === CONTENT_TYPE.SERIES) {
            return {
                usageField: "usage.series",
                usageKey: "series",
                limitField: "maxSeries",
                label: "Series"
            };
        }

        throw new AppError("Content type must be Movie or Series", 400);
    }

    _getUsage(subscription) {
        return {
            movies: Number(subscription.usage?.movies || 0),
            series: Number(subscription.usage?.series || 0)
        };
    }

    _buildConsumptionKey({ profileId, contentId }) {
        const normalizeId = (id) => {
            return mongoose.isValidObjectId(id) ?
                new mongoose.Types.ObjectId(id).toHexString() :
                id.toString().toLowerCase();
        };

        return `${normalizeId(profileId)}:${normalizeId(contentId)}`;
    }

    async consumeViewAllowance({ userId, profileId, contentId, contentType, session = null }) {
        if (!userId || !profileId || !contentId) {
            throw new AppError("User, profile, and content are required to consume viewing usage", 400);
        }

        const usageConfig = this._getUsageConfig(contentType);
        const { subscription, now } = await subscriptionService._getCurrentActiveSubscription(userId, {
            session,
            includeConsumptionKeys: true
        });
        const plan = subscription.planId;
        const periodStart = new Date(subscription.startDate);
        const consumptionKey = this._buildConsumptionKey({
            profileId,
            contentId
        });
        const baseResult = {
            subscriptionId: subscription._id,
            userId,
            profileId,
            contentId,
            contentType,
            periodStart,
            periodEnd: new Date(subscription.endDate),
            consumptionKey,
            usageField: usageConfig.usageField
        };

        const existingUsage = await this._withSession(
            SubscriptionUsage.findOne({
                userId,
                subscriptionId: subscription._id,
                profileId,
                contentId,
                periodStart
            }),
            session
        );

        if (existingUsage) {
            if (subscription.consumedViewKeys?.includes(consumptionKey)) {
                await Subscription.updateOne(
                    {
                        _id: subscription._id,
                        userId,
                        consumedViewKeys: consumptionKey
                    },
                    {
                        $pull: {
                            consumedViewKeys: consumptionKey
                        }
                    },
                    session ? { session } : {}
                );
            }

            return {
                ...baseResult,
                isNewUsage: false,
                newlyConsumed: false,
                usage: this._getUsage(subscription)
            };
        }

        if (subscription.consumedViewKeys?.includes(consumptionKey)) {
            return {
                ...baseResult,
                isNewUsage: false,
                newlyConsumed: false,
                usage: this._getUsage(subscription)
            };
        }

        const limit = Number(plan[usageConfig.limitField]);
        const updateFilter = {
            _id: subscription._id,
            userId,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            startDate: { $lte: now },
            endDate: { $gt: now },
            consumedViewKeys: { $ne: consumptionKey }
        };

        if (plan.isLimited) {
            if (!Number.isFinite(limit) || limit < 0) {
                throw new AppError(`Subscription plan has an invalid ${usageConfig.label} viewing limit`, 500);
            }

            if (limit > 0) {
                updateFilter.$or = [
                    { [usageConfig.usageField]: { $lt: limit } },
                    { [usageConfig.usageField]: { $exists: false } }
                ];
            } else {
                updateFilter[usageConfig.usageField] = { $lt: 0 };
            }
        }

        const updateOptions = { new: true };
        if (session) {
            updateOptions.session = session;
        }

        const updatedSubscription = await Subscription.findOneAndUpdate(
            updateFilter,
            {
                $addToSet: { consumedViewKeys: consumptionKey },
                $inc: { [usageConfig.usageField]: 1 }
            },
            updateOptions
        );

        if (!updatedSubscription) {
            const { subscription: latestSubscription } = await subscriptionService._getCurrentActiveSubscription(userId, {
                session,
                includeConsumptionKeys: true
            });
            const latestUsage = this._getUsage(latestSubscription);

            if (latestSubscription.consumedViewKeys?.includes(consumptionKey)) {
                return {
                    ...baseResult,
                    isNewUsage: false,
                    newlyConsumed: false,
                    usage: latestUsage
                };
            }

            if (plan.isLimited && latestUsage[usageConfig.usageKey] >= limit) {
                throw new AppError(
                    `${usageConfig.label} viewing limit has been exhausted for the current subscription period`,
                    403
                );
            }

            throw new AppError("Unable to consume viewing allowance for the active subscription", 409);
        }

        const consumption = {
            ...baseResult,
            isNewUsage: true,
            newlyConsumed: true,
            usage: this._getUsage(updatedSubscription)
        };

        try {
            const [usageEntry] = await SubscriptionUsage.create(
                [{
                    userId,
                    subscriptionId: subscription._id,
                    profileId,
                    contentId,
                    contentType,
                    periodStart
                }],
                session ? { session } : {}
            );

            consumption.usageId = usageEntry._id;

            const reservationRelease = await Subscription.updateOne(
                {
                    _id: subscription._id,
                    userId,
                    consumedViewKeys: consumptionKey
                },
                {
                    $pull: {
                        consumedViewKeys: consumptionKey
                    }
                },
                session ? { session } : {}
            );

            if (reservationRelease.modifiedCount !== 1) {
                throw new AppError(
                    "Unable to finalize viewing usage for the active subscription",
                    409
                );
            }

            return consumption;
        } catch (error) {
            if (session) {
                throw error;
            }

            if (error?.code === 11000) {
                const ledgerUsageCount = await SubscriptionUsage.countDocuments({
                    userId,
                    subscriptionId: subscription._id,
                    contentType,
                    periodStart
                });
                const reconciledSubscription = await Subscription.findOneAndUpdate(
                    {
                        _id: subscription._id,
                        userId,
                        status: SUBSCRIPTION_STATUS.ACTIVE,
                        startDate: periodStart
                    },
                    {
                        $set: {
                            [usageConfig.usageField]: ledgerUsageCount
                        },
                        $pull: {
                            consumedViewKeys: consumptionKey
                        }
                    },
                    { new: true }
                );

                if (!reconciledSubscription) {
                    throw new AppError(
                        "Unable to reconcile viewing usage for the active subscription",
                        409
                    );
                }

                return {
                    ...baseResult,
                    isNewUsage: false,
                    newlyConsumed: false,
                    usage: this._getUsage(reconciledSubscription)
                };
            }

            await this.rollbackViewAllowance(consumption);
            throw error;
        }
    }

    async rollbackViewAllowance(consumption, session = null) {
        if (!consumption || !consumption.isNewUsage) {
            return { rolledBack: false };
        }

        const {
            subscriptionId,
            userId,
            profileId,
            contentId,
            periodStart,
            consumptionKey,
            usageField,
            usageId,
            contentType
        } = consumption;

        if (!subscriptionId || !userId || !consumptionKey || !usageField) {
            throw new AppError("Invalid viewing usage compensation metadata", 500);
        }

        const ledgerFilter = usageId
            ? { _id: usageId, subscriptionId, userId }
            : {
                subscriptionId,
                userId,
                profileId,
                contentId,
                periodStart
            };

        const updateOptions = session ? { session } : {};

        if (!usageId) {
            const updateResult = await Subscription.updateOne(
                {
                    _id: subscriptionId,
                    userId,
                    consumedViewKeys: consumptionKey,
                    [usageField]: { $gt: 0 }
                },
                {
                    $pull: { consumedViewKeys: consumptionKey },
                    $inc: { [usageField]: -1 }
                },
                updateOptions
            );

            await SubscriptionUsage.deleteOne(ledgerFilter, updateOptions);

            return { rolledBack: updateResult.modifiedCount > 0 };
        }

        const ledgerDelete = await SubscriptionUsage.deleteOne(
            ledgerFilter,
            updateOptions
        );

        if (ledgerDelete.deletedCount === 0) {
            return { rolledBack: false };
        }

        const updateResult = await Subscription.updateOne(
            {
                _id: subscriptionId,
                userId,
                [usageField]: { $gt: 0 }
            },
            {
                $pull: { consumedViewKeys: consumptionKey },
                $inc: { [usageField]: -1 }
            },
            updateOptions
        );

        if (updateResult.modifiedCount === 0) {
            await SubscriptionUsage.create(
                [{
                    _id: usageId,
                    userId,
                    subscriptionId,
                    profileId,
                    contentId,
                    contentType,
                    periodStart
                }],
                updateOptions
            );

            throw new AppError("Unable to compensate viewing usage", 500);
        }

        return { rolledBack: true };
    }

    async getCurrentUsage(userId) {
        if (!userId) {
            throw new AppError("Authenticated user is required", 401);
        }

        const { subscription } = await subscriptionService._getCurrentActiveSubscription(userId);
        const plan = subscription.planId;
        const usage = this._getUsage(subscription);
        const unlimited = "Unlimited";
        const movieLimit = Number(plan.maxMovies);
        const seriesLimit = Number(plan.maxSeries);
        const hasFiniteMovieLimit = Boolean(plan.isLimited) && Number.isFinite(movieLimit);
        const hasFiniteSeriesLimit = Boolean(plan.isLimited) && Number.isFinite(seriesLimit);

        const limits = {
            movies: hasFiniteMovieLimit ? movieLimit : unlimited,
            series: hasFiniteSeriesLimit ? seriesLimit : unlimited
        };
        const remaining = {
            movies: hasFiniteMovieLimit ?
                Math.max(0, movieLimit - usage.movies) :
                unlimited,
            series: hasFiniteSeriesLimit ?
                Math.max(0, seriesLimit - usage.series) :
                unlimited
        };

        return {
            usage,
            limits,
            remaining,
            isLimited: Boolean(plan.isLimited),
            subscriptionPeriod: {
                startDate: new Date(subscription.startDate),
                endDate: new Date(subscription.endDate)
            }
        };
    }

    async assertActiveEntitlement(userId, session = null) {
        const { subscription } = await subscriptionService._getCurrentActiveSubscription(
            userId,
            { session }
        );

        return subscription;
    }
}
module.exports = new SubscriptionUsageService();
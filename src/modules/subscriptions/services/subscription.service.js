const Payment = require("../../Payment/model/Payment");
const Plan = require("../../plans/models/Plan");
const Subscription = require("../models/Subscription");
const AppError = require("../../../shared/errors/AppError");
const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");

const mongoose = require("mongoose");

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

class SubscriptionService {
    _withSession(query, session) {
        return session ? query.session(session) : query;
    }

    async _getCurrentActiveSubscription(userId, { session = null, includeConsumptionKeys = false } = {}) {
        const now = new Date();
        let query = Subscription.find({
            userId,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            startDate: { $lte: now },
            endDate: { $gt: now }
        })
            .sort({ startDate: -1, createdAt: -1 })
            .limit(2)
            .populate("planId");

        if (includeConsumptionKeys) {
            query = query.select("+consumedViewKeys");
        }

        const subscriptions = await this._withSession(query, session);

        if (subscriptions.length === 0) {
            throw new AppError("No active subscription found", 403);
        }

        if (subscriptions.length > 1) {
            throw new AppError("Multiple active subscriptions found for this account", 409);
        }

        const [subscription] = subscriptions;

        if (!subscription.planId) {
            throw new AppError("Subscription plan not found", 404);
        }

        return { subscription, now };
    }

    createSubscription = async(data) => {
        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();
        const { userId, plan, autoRenew, notes, paymentMethod, currency } = data;

        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.duration);

            await Subscription.updateMany(
                {
                    userId,
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    endDate: { $lte: startDate }
                },
                {
                    $set: {
                        status: SUBSCRIPTION_STATUS.EXPIRED,
                        autoRenew: false
                    }
                },
                session ? { session } : {}
            );

            const existingSub = await Subscription.findOne({
                userId,
                status: SUBSCRIPTION_STATUS.ACTIVE,
                endDate: { $gt: startDate }
            }).session(session);

            if (existingSub) {
                throw new AppError("لديك اشتراك فعال حالياً", 409);
            }

            const [subscription] = await Subscription.create([{
                userId,
                planId: plan._id,
                startDate,
                endDate,
                autoRenew: autoRenew || false,
                notes: notes || "Not Found",
                status: SUBSCRIPTION_STATUS.PENDING,
                usage: { movies: 0, series: 0 },
                consumedViewKeys: []
            }], { session });

            const [payment] = await Payment.create([{
                userId,
                subscriptionId: subscription._id,
                amount: plan.price,
                currency: currency || "USD",
                paymentMethod: paymentMethod || "visa",
                status: "completed",
                transactionId: 'TXN_' + Date.now()
            }], { session });

            subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
            await subscription.save({ session });

            if (session) await session.commitTransaction();

            return await Payment.findById(payment._id)
                .populate('userId', 'name email')
                .populate('subscriptionId', '-__v')

        } catch (error) {
            if (session) await session.abortTransaction();

            if (error?.code === 11000) {
                throw new AppError("لديك اشتراك فعال حالياً", 409);
            }

            throw error;
        } finally {
            if (session) session.endSession();
        }
    }

    cancelSubscription = async(data) => {
        const { id, userId } = data;

        const existingSub = await Subscription.findOne({ _id: id, userId });
        if (!existingSub) {
            throw new Error("الاشتراك غير موجود");
        }

        if (existingSub.status === "cancelled") {
            throw new Error("هذا الاشتراك ملغى مسبقاً بالفعل");
        }

        const isExpiredByDate = new Date(existingSub.endDate) < new Date();

        if (existingSub.status === "expired" || isExpiredByDate) {
            existingSub.status = "expired";
            existingSub.autoRenew = false;
            await existingSub.save();

            return {
                msg: "هذا الاشتراك منتهي وقته بالفعل، وتم تحديث حالته بنجاح",
                subscription: existingSub
            };
        }

        existingSub.status = "cancelled";
        existingSub.autoRenew = false;
        await existingSub.save();

        return {
            msg: "تم إلغاء الاشتراك بنجاح",
            subscription: existingSub
        };
    }

    getMySubscriptions = async(data) => {
        const { userId, status } = data;
        let filter = { userId };
        if (status && status !== "all") {
            filter.status = status;
        }
        const mySubscriptions = await Subscription.find(filter).sort({ createdAt: -1 });
        return mySubscriptions
    }

    getMySubscriptionDetails = async(data) => {
        const { userId, id } = data

        const payments = await Payment.find({
            subscriptionId: id,
            userId
        }).populate({
            path: "subscriptionId",
            populate: { path: "planId" }
        });

        if (!payments || payments.length === 0) {
            throw new Error("الاشتراك أو سجلات الدفع غير موجودة");
        }

        const subscriptionDetails = payments[0].subscriptionId;
        const plan = subscriptionDetails.planId;

        let usageStats = null;

        if (plan && plan.isLimited) {
            usageStats = {
                movies: {
                    consumed: subscriptionDetails.usage?.movies || 0,
                    total: plan.maxMovies,
                    remaining: Math.max(0, plan.maxMovies - (subscriptionDetails.usage?.movies || 0))
                },
                series: {
                    consumed: subscriptionDetails.usage?.series || 0,
                    total: plan.maxSeries,
                    remaining: Math.max(0, plan.maxSeries - (subscriptionDetails.usage?.series || 0))
                }
            };
        } else {
            usageStats = {
                message: "باقتك غير محدودة (Unlimited)",
                movies: { consumed: subscriptionDetails.usage?.movies || 0, total: "Unlimited" },
                series: { consumed: subscriptionDetails.usage?.series || 0, total: "Unlimited" }
            };
        }

        const formattedPayments = payments.map(payment => {
            const paymentObj = payment.toObject();
            delete paymentObj.subscriptionId;
            return paymentObj;
        });

        const result = {
            subscription: subscriptionDetails,
            usageStats: usageStats,
            payments: formattedPayments
        };

        return result;
    }
}
module.exports = new SubscriptionService();
const mongoose = require("mongoose");
const Payment = require("../../Payment/model/Payment");
const Plan = require("../../plans/models/Plan");
const Subscription = require("../models/Subscription");
const AppError = require("../../../shared/errors/AppError");
const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

class SubscriptionRenewalService {
    _withSession(query, session) {
        return session ? query.session(session) : query;
    }

    async renewManual(data) {
        const { subscriptionId, userId, paymentMethod, currency, autoRenew } = data;

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            const existingSub = await Subscription.findOne({ _id: subscriptionId, userId }).session(session);
            if (!existingSub) {
                throw new AppError("الاشتراك غير موجود", 404);
            }

            const startDateForNewPeriod = new Date();
            if (new Date(existingSub.endDate) > startDateForNewPeriod) {
                throw new AppError(
                    "لا يمكن تجديد الاشتراك قبل انتهاء فترة الاشتراك الحالية",
                    409
                );
            }

            const subscriptionPlan = await Plan.findById(existingSub.planId).session(session);
            if (!subscriptionPlan) {
                throw new AppError("الخطة غير موجودة", 404);
            }

            await Subscription.updateMany(
                {
                    _id: { $ne: existingSub._id },
                    userId,
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    endDate: { $lte: startDateForNewPeriod }
                },
                {
                    $set: {
                        status: SUBSCRIPTION_STATUS.EXPIRED,
                        autoRenew: false
                    }
                },
                session ? { session } : {}
            );

            const otherActiveSubscription = await Subscription.findOne({
                _id: { $ne: existingSub._id },
                userId,
                status: SUBSCRIPTION_STATUS.ACTIVE,
                endDate: { $gt: startDateForNewPeriod }
            }).session(session);

            if (otherActiveSubscription) {
                throw new AppError("لديك اشتراك فعال حالياً", 409);
            }

            const newEndDate = new Date(startDateForNewPeriod);
            newEndDate.setDate(newEndDate.getDate() + Number(subscriptionPlan.duration));

            const renewalOptions = { new: true };
            if (session) {
                renewalOptions.session = session;
            }

            const renewedSubscription = await Subscription.findOneAndUpdate(
                {
                    _id: existingSub._id,
                    userId,
                    status: existingSub.status,
                    startDate: existingSub.startDate,
                    endDate: existingSub.endDate
                },
                {
                    $set: {
                        startDate: startDateForNewPeriod,
                        endDate: newEndDate,
                        status: SUBSCRIPTION_STATUS.ACTIVE,
                        autoRenew: autoRenew !== undefined ?
                            autoRenew :
                            existingSub.autoRenew,
                        usage: { movies: 0, series: 0 },
                        consumedViewKeys: []
                    }
                },
                renewalOptions
            );

            if (!renewedSubscription) {
                throw new AppError(
                    "تم تجديد الاشتراك بالفعل أو تغيرت حالته؛ أعد المحاولة",
                    409
                );
            }

            const payment = await Payment.create([{
                userId: userId,
                subscriptionId: renewedSubscription._id,
                planId: subscriptionPlan._id,
                amount: subscriptionPlan.price,
                currency: currency || "USD",
                paymentMethod: paymentMethod || "visa",
                status: "completed",
                transactionId: (
                    `RENEWAL_${renewedSubscription._id}_` +
                    startDateForNewPeriod.getTime()
                )
            }], { session });

            if (session) await session.commitTransaction();

            const populatedPayment = await Payment.findById(payment[0]._id)
                .populate('userId', 'name email')
                .populate('subscriptionId');

            return {
                subscription: {
                    payment: populatedPayment
                }
            };

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

    async renewExpiredAutomatic({ subscriptionId, expectedEndDate }) {
        const periodStart = new Date(expectedEndDate);

        if (!subscriptionId || Number.isNaN(periodStart.getTime())) {
            throw new AppError("Invalid automatic renewal period", 400);
        }

        const session = useTransaction ? await mongoose.startSession() : null;
        let claimedPeriod = null;
        let result = { renewed: false };

        const renew = async() => {
            let subscriptionQuery = Subscription.findOne({
                _id: subscriptionId,
                status: SUBSCRIPTION_STATUS.ACTIVE,
                autoRenew: true,
                endDate: periodStart
            }).populate("planId");
            subscriptionQuery = this._withSession(subscriptionQuery, session);

            const subscription = await subscriptionQuery;

            if (!subscription) {
                return;
            }

            const plan = subscription.planId;

            if (!plan) {
                throw new AppError("Subscription plan not found", 404);
            }

            const duration = Number(plan.duration);

            if (!Number.isFinite(duration) || duration < 1) {
                throw new AppError("Subscription plan duration is invalid", 500);
            }

            const newEndDate = new Date(periodStart);
            newEndDate.setDate(newEndDate.getDate() + duration);

            if (newEndDate <= new Date()) {
                return;
            }

            const updateOptions = { new: true };
            if (session) {
                updateOptions.session = session;
            }

            const renewedSubscription = await Subscription.findOneAndUpdate(
                {
                    _id: subscriptionId,
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    autoRenew: true,
                    endDate: periodStart
                },
                {
                    $set: {
                        startDate: periodStart,
                        endDate: newEndDate,
                        status: SUBSCRIPTION_STATUS.ACTIVE,
                        usage: { movies: 0, series: 0 },
                        consumedViewKeys: []
                    }
                },
                updateOptions
            );

            if (!renewedSubscription) {
                return;
            }

            claimedPeriod = {
                subscriptionId: renewedSubscription._id,
                startDate: periodStart,
                endDate: newEndDate
            };

            const transactionId = (
                `AUTO_RENEW_${renewedSubscription._id}_${periodStart.getTime()}`
            );
            const existingPayment = await this._withSession(
                Payment.findOne({
                    subscriptionId: renewedSubscription._id,
                    transactionId
                }),
                session
            );

            if (!existingPayment) {
                const lastPayment = await this._withSession(
                    Payment.findOne({
                        subscriptionId: renewedSubscription._id,
                        status: "completed"
                    }).sort({ createdAt: -1 }),
                    session
                );

                await Payment.create(
                    [{
                        userId: renewedSubscription.userId,
                        subscriptionId: renewedSubscription._id,
                        planId: plan._id,
                        amount: plan.price,
                        currency: lastPayment ? lastPayment.currency : "USD",
                        paymentMethod: lastPayment ? lastPayment.paymentMethod : "visa",
                        status: "completed",
                        transactionId
                    }],
                    session ? { session } : {}
                );
            }

            result = {
                renewed: true,
                subscriptionId: renewedSubscription._id,
                startDate: periodStart,
                endDate: newEndDate,
                transactionId
            };
        };

        try {
            if (session) {
                await session.withTransaction(renew);
            } else {
                await renew();
            }

            return result;
        } catch (error) {
            if (!session && claimedPeriod) {
                await Subscription.updateOne(
                    {
                        _id: claimedPeriod.subscriptionId,
                        startDate: claimedPeriod.startDate,
                        endDate: claimedPeriod.endDate
                    },
                    {
                        $set: {
                            status: SUBSCRIPTION_STATUS.EXPIRED,
                            autoRenew: false,
                            endDate: claimedPeriod.startDate
                        }
                    }
                );
            }

            throw error;
        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }
}
module.exports = new SubscriptionRenewalService();
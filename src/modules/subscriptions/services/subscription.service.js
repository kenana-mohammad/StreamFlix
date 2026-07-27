const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");
const Payment = require("../../Payment/model/Payment");
const Plan = require("../../plans/models/Plan");
const Subscription = require("../models/Subscription");

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

class SubscriptionService {
    createSubscription = async(data) => {
            const session = useTransaction ? await mongoose.startSession() : null;
            if (session) session.startTransaction();
            const { userId, plan, autoRenew, notes, paymentMethod, currency } = data;

            try {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + plan.duration);

                const existingSub = await Subscription.findOne({
                    userId,
                    status: 'active',
                    endDate: {
                        $gt: new Date(),

                    }
                }).session(session);

                if (existingSub) {
                    throw new Error("لديك اشتراك فعال حالياً اذا كنت ترغب بباقة اخرى قم بالترقية");
                }

                const [subscription] = await Subscription.create([{
                    userId,
                    planId: plan._id,
                    startDate,
                    endDate,
                    autoRenew: autoRenew || false,
                    notes: notes || "Not Found",
                    status: "pending"
                }], { session });

                const [payment] = await Payment.create([{
                    userId,
                    subscriptionId: subscription._id,
                    amount: plan.price,
                    currency: currency || "USD",
                    paymentMethod: paymentMethod || "Not Found",
                    status: "completed",
                    transactionId: 'TXN_' + Date.now()
                }], { session });

                subscription.status = "active";
                await subscription.save({ session });

                if (session) await session.commitTransaction();

                return await Payment.findById(payment._id)
                    .populate('userId', 'name email')
                    .populate('subscriptionId', '-__v')


            } catch (error) {
                if (session) await session.abortTransaction();
                throw error;
            } finally {
                if (session) session.endSession();
            }



        }
        /////////====================================
    async renewManual(data) {
            const { subscriptionId, userId, paymentMethod, currency, autoRenew } = data;

            const session = useTransaction ? await mongoose.startSession() : null;
            if (session) session.startTransaction();

            try {
                const existingSub = await Subscription.findOne({ _id: subscriptionId, userId }).session(session);
                if (!existingSub) throw new Error("الاشتراك غير موجود");

                const subscriptionPlan = await Plan.findById(existingSub.planId);
                if (!subscriptionPlan) throw new Error("الخطة غير موجودة");

                const todayStr = new Date().toISOString().split('T')[0];
                const endStr = new Date(existingSub.endDate).toISOString().split('T')[0];
                const today = new Date(todayStr);
                const end = new Date(endStr);

                const diffInTime = end.getTime() - today.getTime();
                const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));
                const startDateForNewPeriod = (diffInDays >= 0) ? new Date(existingSub.endDate) : new Date();

                const newEndDate = new Date(startDateForNewPeriod);
                newEndDate.setDate(newEndDate.getDate() + Number(subscriptionPlan.duration));

                existingSub.startDate = startDateForNewPeriod;
                existingSub.endDate = newEndDate;
                existingSub.status = "active";
                existingSub.autoRenew = autoRenew !== undefined ? autoRenew : existingSub.autoRenew;
                await existingSub.save({ session });

                const payment = await Payment.create([{
                    userId: userId,
                    subscriptionId: existingSub._id,
                    planId: subscriptionPlan._id,
                    amount: subscriptionPlan.price,
                    currency: currency || "USD",
                    paymentMethod: paymentMethod || "CreditCard",
                    status: "completed",
                    transactionId: `RENEWAL_${Date.now()}`
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
                throw error;
            } finally {
                if (session) session.endSession();
            }
        }
        //////===================================================================================

    // cancelSubscription
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
        //=============================================
        //getMySubscriptions
    getMySubscriptions = async(data) => {
            const { userId, status } = data;
            let filter = { userId };
            if (status && status !== "all") {
                filter.status = status;
            }
            const mySubscriptions = await Subscription.find(filter).populate("userId", "name email")
                .populate("planId", "name price duration isLimited maxProfiles ").sort({ createdAt: -1 });
            return mySubscriptions

        }
        //=========================================
    getMySubscriptionDetails = async(data) => {
            const { userId, id } = data;

            const payments = await Payment.find({
                subscriptionId: id,
                userId
            }).populate({
                path: "subscriptionId",
                populate: {
                    path: "planId",
                    model: "Plan"
                }
            });

            if (!payments || payments.length === 0) {
                throw new Error("الاشتراك أو سجلات الدفع غير موجودة");
            }

            const subscriptionDetails = payments[0].subscriptionId;

            const formattedPayments = payments.map(payment => {
                const paymentObj = payment.toObject();
                delete paymentObj.subscriptionId;
                return paymentObj;
            });

            const result = {
                subscription: subscriptionDetails,
                payments: formattedPayments
            };

            return result;
        }
        //=========================================================================
        //upgrade 
    async upgradeSubscription(data) {
        const { userId, newPlan, bodyData } = data;
        const newPlanId = newPlan._id;

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            const existsSub = await Subscription.findOne({ userId, status: SUBSCRIPTION_STATUS.ACTIVE }).session(session);
            if (!existsSub) {
                throw new Error("لا يوجد لديك اشتراك نشط لتقوم بالترقية");
            }

            await existsSub.populate("planId");

            if (existsSub.planId._id.toString() === newPlanId.toString()) {
                throw new Error("لا يمكنك الترقية إلى نفس الباقة الحالية");
            }

            if (existsSub.planId.price >= newPlan.price) {
                throw new Error("لا يمكن الترقية لباقة أقل أو مساوية سعرياً");
            }

            const { autoRenew, notes, paymentMethod, currency } = bodyData;

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + Number(newPlan.duration));

            const [subscription] = await Subscription.create([{
                userId,
                planId: newPlanId,
                startDate,
                endDate,
                autoRenew: autoRenew || false,
                notes: notes || "Upgraded Plan",
                status: "pending"
            }], { session });

            const [payment] = await Payment.create([{
                userId,
                subscriptionId: subscription._id,
                planId: newPlanId,
                amount: newPlan.price,
                currency: currency || "USD",
                paymentMethod: paymentMethod || "visa",
                status: "completed",
                transactionId: 'UPG_' + Date.now()
            }], { session });

            subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
            await subscription.save({ session });

            existsSub.status = SUBSCRIPTION_STATUS.UPGRADED;
            await existsSub.save({ session });

            if (session) await session.commitTransaction();

            return { subscription, payment };

        } catch (error) {
            if (session) await session.abortTransaction();
            throw error;
        } finally {
            if (session) session.endSession();
        }
    }

}



module.exports = new SubscriptionService()
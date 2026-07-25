const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");
const Payment = require("../../Payment/model/Payment");
const Subscription = require("../models/Subscription");

class AdminSubscriptionService {
    getSubscriptions = async(queryStatus) => {
            let filter = {};


            if (queryStatus && queryStatus !== "all") {
                filter.status = queryStatus;
            }

            const subscriptions = await Subscription.find(filter)
                .populate("planId")
                .populate("userId", "name email")
                .sort({ createdAt: -1 });

            return subscriptions;
        }
        /////=====================
    getSubscriptionDetails = async(subscriptionId) => {
            const payments = await Payment.find({
                    subscriptionId: subscriptionId
                })
                .populate({
                    path: "subscriptionId",
                    populate: [
                        { path: "planId" },
                        { path: "userId", select: "name email phone" } // جلب بيانات المستخدم المالك للاشتراك
                    ]
                });

            if (!payments || payments.length === 0) {
                const subscription = await Subscription.findById(subscriptionId)
                    .populate("planId")
                    .populate("userId", "name email phone");

                if (!subscription) {
                    throw new Error("الاشتراك غير موجود");
                }

                return {
                    subscription: subscription,
                    payments: [] // لا توجد سجلات دفع بعد
                };
            }

            const subscriptionDetails = payments[0].subscriptionId;

            const formattedPayments = payments.map(payment => {
                const paymentObj = payment.toObject();
                delete paymentObj.subscriptionId;
                return paymentObj;
            });

            return {
                subscription: subscriptionDetails,
                payments: formattedPayments
            };
        }
        //---------------
    async getAdminStats() {
        const activeCount = await Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.ACTIVE });
        const upgradedCount = await Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.UPGRADED });
        const expiredCount = await Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.EXPIRED });

        const payments = await Payment.find({ status: "completed" });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        const activeSubs = await Subscription.find({ status: SUBSCRIPTION_STATUS.ACTIVE }).populate("planId");

        const planCounts = {};
        activeSubs.forEach(sub => {
            if (sub.planId) {
                const planName = sub.planId.name;
                planCounts[planName] = (planCounts[planName] || 0) + 1;
            }
        });

        let mostPopularPlan = null;
        let maxCount = 0;
        for (const [name, count] of Object.entries(planCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostPopularPlan = { planName: name, count: count };
            }
        }

        return {
            counts: {
                active: activeCount,
                upgraded: upgradedCount,
                expired: expiredCount
            },
            financials: {
                totalRevenue
            },
            analytics: {
                mostPopularPlan
            }
        };
    }
}
module.exports = new AdminSubscriptionService()
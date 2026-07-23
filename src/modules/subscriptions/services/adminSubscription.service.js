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
}
module.exports = new AdminSubscriptionService()
const cron = require('node-cron');
const Subscription = require('../modules/subscriptions/models/Subscription');
const Payment = require('../modules/Payment/model/Payment');


class SubscriptionScheduler {
    init() {
        cron.schedule('0 * * * *', async() => {
            try {
                const now = new Date();

                // 1. تحديث المنتهي
                await Subscription.updateMany({ status: { $in: ['active', 'pending'] }, endDate: { $lt: now } }, { $set: { status: 'expired', autoRenew: false } });

                // 2. التجديد التلقائي
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                const subsToRenew = await Subscription.find({
                    status: 'active',
                    autoRenew: true,
                    endDate: { $gte: now, $lte: twoHoursLater }
                }).populate('planId');

                for (const sub of subsToRenew) {
                    const plan = sub.planId;
                    if (!plan) continue;

                    const todayStr = new Date().toISOString().split('T')[0];
                    const endStr = new Date(sub.endDate).toISOString().split('T')[0];
                    const diffInDays = Math.round((new Date(endStr) - new Date(todayStr)) / (1000 * 3600 * 24));

                    const startDateForNewPeriod = (diffInDays >= 0) ? new Date(sub.endDate) : new Date();
                    const newEndDate = newEndDate = new Date(startDateForNewPeriod);
                    newEndDate.setDate(newEndDate.getDate() + Number(plan.duration));

                    sub.startDate = startDateForNewPeriod;
                    sub.endDate = newEndDate;
                    sub.status = "active";
                    await sub.save();

                    const lastPayment = await Payment.findOne({ subscriptionId: sub._id, status: "completed" }).sort({ createdAt: -1 });

                    await Payment.create({
                        userId: sub.userId,
                        subscriptionId: sub._id,
                        planId: plan._id,
                        amount: plan.price,
                        currency: lastPayment ? lastPayment.currency : "USD",
                        paymentMethod: lastPayment ? lastPayment.paymentMethod : "Auto_Renewal",
                        status: "completed",
                        transactionId: `AUTO_RENEW_${Date.now()}`
                    });
                }
            } catch (error) {
                console.error('[Subscription Scheduler Error]:', error);
            }
        });
    }
}

module.exports = new SubscriptionScheduler();
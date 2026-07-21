const cron = require('node-cron');
const Subscription = require('../modules/subscriptions/models/Subscription');
const Payment = require('../modules/Payment/model/Payment');

class SubscriptionScheduler {
    /**
     * Initializes all background cron jobs for subscriptions.
     * Runs hourly to check for expired subscriptions and process auto-renewals.
     * @returns {void}
     */
    init() {
        cron.schedule('0 * * * *', async() => {
            try {
                const now = new Date();

                /**
                 * 1. Expire outdated subscriptions
                 * Automatically updates active/pending subscriptions whose end date has passed to 'expired'.
                 */
                await Subscription.updateMany({ status: { $in: ['active', 'pending'] }, endDate: { $lt: now } }, { $set: { status: 'expired', autoRenew: false } });

                /**
                 * 2. Automatic Renewal Processing
                 * Finds active subscriptions with auto-renew enabled expiring within the next 2 hours.
                 */
                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                const subsToRenew = await Subscription.find({
                    status: 'active',
                    autoRenew: true,
                    endDate: { $gte: now, $lte: twoHoursLater }
                }).populate('planId');

                for (const sub of subsToRenew) {
                    const plan = sub.planId;
                    if (!plan) continue;

                    /**
                     * Calculate new subscription period seamlessly starting from the exact current end date.
                     */
                    const startDateForNewPeriod = new Date(sub.endDate);
                    const newEndDate = new Date(startDateForNewPeriod);
                    newEndDate.setDate(newEndDate.getDate() + Number(plan.duration));

                    // Update subscription timeframe and status
                    sub.startDate = startDateForNewPeriod;
                    sub.endDate = newEndDate;
                    sub.status = "active";
                    await sub.save();

                    // Retrieve last successful payment to retain currency and payment method preferences
                    const lastPayment = await Payment.findOne({ subscriptionId: sub._id, status: "completed" }).sort({ createdAt: -1 });

                    // Generate a new payment record for the auto-renewal transaction
                    await Payment.create({
                        userId: sub.userId,
                        subscriptionId: sub._id,
                        planId: plan._id,
                        amount: plan.price,
                        currency: lastPayment ? lastPayment.currency : "USD",
                        paymentMethod: lastPayment ? lastPayment.paymentMethod : "visa",
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
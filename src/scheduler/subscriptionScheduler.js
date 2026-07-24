const cron = require('node-cron');
const Subscription = require('../modules/subscriptions/models/Subscription');
const subscriptionRenewalService = require('../modules/subscriptions/services/subscriptionRenewal.service');
const { SUBSCRIPTION_STATUS } = require('../shared/constants/subscription-status.constant');

class SubscriptionScheduler {
    /**
     * Initializes all background cron jobs for subscriptions.
     * Runs every minute to process subscription-period boundaries promptly.
     * @returns {void}
     */
    init() {
        cron.schedule('* * * * *', async() => {
            try {
                const now = new Date();

                /**
                 * 1. Automatic renewal processing
                 * Renew only after the paid period has ended so current-period
                 * usage is never reset early.
                 */
                const subsToRenew = await Subscription.find({
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    autoRenew: true,
                    endDate: { $lte: now }
                }).select('_id endDate');

                for (const sub of subsToRenew) {
                    try {
                        await subscriptionRenewalService.renewExpiredAutomatic({
                            subscriptionId: sub._id,
                            expectedEndDate: sub.endDate
                        });
                    } catch (error) {
                        console.error(`[Subscription Auto-Renewal Error: ${sub._id}]`, error);
                    }
                }

                /**
                 * 2. Expire elapsed subscriptions that were not renewed.
                 */
                await Subscription.updateMany(
                    {
                        status: {
                            $in: [
                                SUBSCRIPTION_STATUS.ACTIVE,
                                SUBSCRIPTION_STATUS.PENDING
                            ]
                        },
                        endDate: { $lte: now }
                    },
                    {
                        $set: {
                            status: SUBSCRIPTION_STATUS.EXPIRED,
                            autoRenew: false
                        }
                    }
                );
            } catch (error) {
                console.error('[Subscription Scheduler Error]:', error);
            }
        });
    }
}

module.exports = new SubscriptionScheduler();

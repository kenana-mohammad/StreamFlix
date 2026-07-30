const cron = require('node-cron');
const Content = require('../models/Content');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

class SchedulerService {
    init() {
        cron.schedule('* * * * *', async () => {
            try {
                const currentTime = new Date();
                const result = await Content.updateMany(
                    {
                        status: CONTENT_STATUS.DRAFT,
                        publishAt: { $lte: currentTime }
                    },
                    {
                        $set: { status: CONTENT_STATUS.PUBLISHED }
                    }
                );

                if (result.modifiedCount > 0) {
                    console.log(`[Automated Scheduler] Successfully published ${result.modifiedCount} items.`);
                }
            } catch (error) {
                console.error('[Automated Scheduler] Error publishing content:', error);
            }
        });
    }
}

module.exports = new SchedulerService();
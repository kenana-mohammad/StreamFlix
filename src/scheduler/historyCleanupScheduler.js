const cron = require('node-cron');
const WatchHistory = require('../modules/watch-history/models/WatchHistory');

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

class HistoryCleanupScheduler {
    init() {
        // هذا السكربت يشتغل تلقائياً كل يوم الساعة 3:00 فجراً بتوقيت السيرفر
        cron.schedule('0 3 * * *', async () => {
            try {
                const oneYearAgo = new Date(Date.now() - ONE_YEAR_MS);

                // حذف كل السجلات التي لم يتم تحديثها منذ أكثر من سنة
                const result = await WatchHistory.deleteMany({
                    updatedAt: { $lte: oneYearAgo }
                });

                if (result.deletedCount > 0) {
                    console.log(`[Cleanup Scheduler]: Deleted ${result.deletedCount} old watch history records.`);
                }
            } catch (error) {
                console.error('[Cleanup Scheduler Error]:', error);
            }
        });
    }
}

module.exports = new HistoryCleanupScheduler();

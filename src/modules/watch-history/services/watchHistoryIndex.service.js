const WatchHistory = require('../models/WatchHistory');
const ContentViewEvent = require('../models/ContentViewEvent');

class WatchHistoryIndexService {
    async ensureIndexes() {
        await WatchHistory.createIndexes();
        return ContentViewEvent.createIndexes();
    }
}

module.exports = new WatchHistoryIndexService();

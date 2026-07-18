const Content = require('../models/Content');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

class ContentService {
    async getAllContent(isAdmin = false, query = {}) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };

        if (query.type) {
            matchCondition.type = query.type;
        }

        const contents = await Content.find(matchCondition).sort({ createdAt: -1 });
        return contents;
    }

    async getContentById(id, isAdmin = false) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };

        const content = await Content.findOne({ _id: id, ...matchCondition });

        if (!content) {
            throw new AppError('Content not found or not available', 404);
        }

        return content;
    }
}

module.exports = new ContentService();
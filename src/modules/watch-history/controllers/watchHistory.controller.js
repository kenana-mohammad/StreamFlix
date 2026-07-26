const {
    successResponse
} = require('../../../shared/helpers/api-response.helper');
const watchHistoryService = require('../services/watchHistory.service');

class WatchHistoryController {
    saveOrUpdateProgress = async(req, res) => {
        const userId = req._user.id;
        const profileId = req.params.profileId || req.headers['x-profile-id'];
        const {
            contentId,
            progress,
            stoppedAt,
            totalDuration,
            episodeId,
            viewSessionId
        } = req.body;

        const result = await watchHistoryService.saveOrUpdateProgress({
            userId,
            profileId,
            contentId,
            progress,
            stoppedAt,
            totalDuration,
            episodeId,
            viewSessionId
        });

        const statusCode = result.action ===
            watchHistoryService.VIEW_ACTION.NEW_VIEW ?
            201 :
            200;

        return successResponse(
            res,
            statusCode,
            'Watch History saved successfully',
            result
        );
    };

    getHistory = async(req, res) => {
        const userId = req._user.id;
        const profileId = req.params.profileId || req.headers['x-profile-id'];
        const history = await watchHistoryService.getHistory(userId, profileId);

        return successResponse(
            res,
            200,
            'Watch History retrieved successfully',
            history
        );
    };

    removeItem = async(req, res) => {
        const userId = req._user.id;
        const profileId = req.params.profileId || req.headers['x-profile-id'];
        const { contentId } = req.params;
        const history = await watchHistoryService.removeItem(
            userId,
            profileId,
            contentId
        );

        return successResponse(
            res,
            200,
            'Watch History item deleted successfully',
            history
        );
    };

    clearAll = async(req, res) => {
        const userId = req._user.id;
        const profileId = req.params.profileId || req.headers['x-profile-id'];
        const result = await watchHistoryService.clearAll(userId, profileId);

        return successResponse(
            res,
            200,
            'Watch History deleted successfully',
            result
        );
    };

    getAnalytics = async(req, res) => {
        const analytics = await watchHistoryService.getAnalytics();

        return successResponse(
            res,
            200,
            'Watch History analytics retrieved successfully',
            analytics
        );
    };
}

module.exports = new WatchHistoryController();

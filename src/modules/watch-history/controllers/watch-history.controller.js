const watchHistoryService = require('../services/watch-history.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const { VIEW_ACTION } = require('../../../shared/constants/view-action.constant');

class WatchHistoryController {
    recordViewing = async(req, res) => {
        const { profileId } = req.params;
        const {
            contentId,
            progress,
            totalDuration,
            stoppedAt,
            episodeId
        } = req.body;

        const result = await watchHistoryService.recordViewing({
            userId: req._user.id,
            profileId,
            contentId,
            progress,
            totalDuration,
            stoppedAt,
            episodeId
        });
        const statusCode = result.action === VIEW_ACTION.NEW_VIEW ? 201 : 200;

        return successResponse(
            res,
            statusCode,
            'Viewing activity recorded successfully',
            result
        );
    };

    getHistory = async(req, res) => {
        const { profileId } = req.params;
        const history = await watchHistoryService.getHistory(
            req._user.id,
            profileId
        );

        return successResponse(
            res,
            200,
            'Watch history retrieved successfully',
            history
        );
    };

    deleteHistoryItem = async(req, res) => {
        const { profileId, contentId } = req.params;
        const history = await watchHistoryService.deleteHistoryItem(
            req._user.id,
            profileId,
            contentId
        );

        return successResponse(
            res,
            200,
            'Content removed from watch history successfully',
            history
        );
    };

    deleteAllHistory = async(req, res) => {
        const { profileId } = req.params;
        const result = await watchHistoryService.deleteAllHistory(
            req._user.id,
            profileId
        );

        return successResponse(
            res,
            200,
            'Watch history cleared successfully',
            result
        );
    };
}

module.exports = new WatchHistoryController();

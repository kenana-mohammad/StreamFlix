const AppError = require('../../../shared/errors/AppError');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const watchHistoryService = require('../services/watchHistory.service');
class WatchHistoryController {

    /**
     * POST /api/v1/history
     * حفظ أو تحديث تقدم المشاهدة
     */
    saveProgress = async(req, res) => {
        const {
            contentId,
            episodeId,
            progressTime,
            totalDuration
        } = req.body;

        if (!contentId ||
            progressTime === undefined ||
            !totalDuration
        ) {
            throw new AppError(
                'contentId, progressTime and totalDuration are required',
                400
            );
        }

        const history = await watchHistoryService.saveProgress({
            userId: req._user.id,
            subscription: req.subscription,
         profileId :req.currentProfileId,
            contentId,
            episodeId: episodeId || null,
            progressTime,
            totalDuration
        });

        return successResponse(
            res,
            201,
            'Watch progress saved successfully',
            history
        );
    };


    /**
     * GET /api/v1/history
     * جلب سجل المشاهدة للبروفايل الحالي
     */
    getHistory = async(req, res) => {

        const history = await watchHistoryService.getHistory(
            req.currentProfileId
        );

        return successResponse(
            res,
            200,
            'Watch history retrieved successfully',
            history
        );
    };

    //=============================================================
    getOne = async(req, res) => {

        const { contentId } = req.params;

        const history = await watchHistoryService.getOne(
            req.currentProfileId,
            contentId
        );

        return successResponse(
            res,
            200,
            "Watch progress retrieved successfully",
            history
        );
    };
    /**
     * DELETE /api/v1/history/:contentId
     * حذف سجل مشاهدة محتوى معين للبروفايل الحالي
     */
    deleteOne = async(req, res) => {

        const { contentId } = req.params;

        const result = await watchHistoryService.deleteOne(
            req.currentProfileId,
            contentId
        );

        return successResponse(
            res,
            200,
            'Watch history item deleted successfully',

        );
    };


    /**
     * DELETE /api/v1/history
     * حذف كامل سجل المشاهدة للبروفايل الحالي
     */
    deleteAll = async(req, res) => {

        const result = await watchHistoryService.deleteAll(
            req.currentProfileId
        );

        return successResponse(
            res,
            200,
            'Watch history deleted successfully',
        );
    };
}


module.exports = new WatchHistoryController();
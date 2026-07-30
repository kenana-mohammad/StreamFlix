const ratingService = require("../services/rating.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class RatingController {

    /**
     * إضافة أو تحديث تقييم (ذكي - يتحقق إذا التقييم موجود)
     * POST /api/v1/ratings/:contentId
     */
    createOrUpdate = async (req, res) => {
        const { rating, review } = req.body;
        const { contentId } = req.params;
        const profileId = req.currentProfileId; // من الـ validateProfileToken middleware

        const ratingData = {
            profileId,
            contentId,
            rating,
            review
        };

        const result = await ratingService.createOrUpdate(ratingData);

        return successResponse(
            res,
            result.isNew ? 201 : 200,
            result.isNew ? "Rating added successfully" : "Rating updated successfully",
            result.rating
        );
    };


    /**
     * عرض تقييم البروفايل الحالي لمحتوى معين
     * GET /api/v1/ratings/:contentId/my-rating
     */
    getMyRating = async (req, res) => {
        const { contentId } = req.params;
        const profileId = req.currentProfileId;

        const rating = await ratingService.getMyRating(profileId, contentId);

        return successResponse(
            res,
            200,
            "Rating fetched successfully",
            rating
        );
    };


    /**
     * عرض جميع تقييمات البروفايل الحالي
     * GET /api/v1/ratings/my-ratings
     */
    getMyRatings = async (req, res) => {
        const profileId = req.currentProfileId;

        const ratings = await ratingService.getMyRatings(profileId);

        return successResponse(
            res,
            200,
            "Your ratings fetched successfully",
            ratings
        );
    };


    /**
     * عرض جميع التقييمات لمحتوى معين + الإحصائيات
     * GET /api/v1/ratings/:contentId/all
     */
    getContentRatings = async (req, res) => {
        const { contentId } = req.params;

        const result = await ratingService.getContentRatings(contentId);

        return successResponse(
            res,
            200,
            "Content ratings fetched successfully",
            result
        );
    };


    // ========================================
    // Admin routes (موجودة في adminRating.routes.js)
    // ========================================

    getRecentRatings = async (req, res) => {
        const ratings = await ratingService.getRecentRatings();

        return successResponse(
            res,
            200,
            "Recent ratings fetched successfully",
            ratings
        );
    };


    deleteRating = async (req, res) => {
        await ratingService.deleteRating(req.params.id);

        return successResponse(
            res,
            200,
            "Rating deleted successfully"
        );
    };

}


module.exports = new RatingController();
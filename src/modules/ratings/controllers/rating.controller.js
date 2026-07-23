const ratingService = require("../services/rating.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class RatingController {

    create = async (req, res) => {

        const {
            profileId,
            contentId,
            rating,
            review
        } = req.body;

        const ratingData = {
            profileId,
            contentId,
            rating,
            review
        };

        const ratingObj = await ratingService.create(ratingData);

        return successResponse(
            res,
            201,
            "Rating created successfully",
            ratingObj
        );
    };

    update = async (req, res) => {

        const {
            rating,
            review
        } = req.body;

        const ratingData = {
            rating,
            review
        };

        const ratingObj = await ratingService.update(
            req.params.contentId,
            ratingData
        );

        return successResponse(
            res,
            200,
            "Rating updated successfully",
            ratingObj
        );
    };

    remove = async (req, res) => {

        await ratingService.remove(req.params.contentId);

        return successResponse(
            res,
            200,
            "Rating deleted successfully"
        );
    };

    // Front APIs
    getMyRatings = async (req, res) => {

        const ratings = await ratingService.getMyRatings();

        return successResponse(
            res,
            200,
            "Ratings fetched successfully",
            ratings
        );
    };

    // Front APIs
    getContentRating = async (req, res) => {

        const rating = await ratingService.getContentRating(
            req.params.contentId
        );

        return successResponse(
            res,
            200,
            "Content rating fetched successfully",
            rating
        );
    };

}

module.exports = new RatingController();
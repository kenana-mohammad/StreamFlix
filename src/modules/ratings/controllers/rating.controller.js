const ratingService = require("../services/rating.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class RatingController {

    create = async (req, res) => {

        const {
            contentId,
            rating,
            review
        } = req.body;

        const ratingData = {
            userId: req._user.id,
            contentId,
            rating,
            review
        };

        const ratingObj = await ratingService.create(ratingData);

        return successResponse(
            res,
            201,
            "Rating saved successfully",
            ratingObj
        );
    };

    // Front APIs
    getMyRatings = async (req, res) => {

        const ratings = await ratingService.getMyRatings(req._user.id);

        return successResponse(
            res,
            200,
            "Ratings fetched successfully",
            ratings
        );
    };

    // Front APIs
    getContentRating = async (req, res) => {

        const ratings = await ratingService.getContentRating(
            req.params.contentId
        );

        return successResponse(
            res,
            200,
            "Content ratings fetched successfully",
            ratings
        );
    };

}

module.exports = new RatingController();
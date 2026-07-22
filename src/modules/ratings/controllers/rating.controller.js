const ratingService = require("../services/rating.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class RatingController {

create = async (req, res) => {

    const {
        contentId,
        rating,
        review
    } = req.body;
console.log(req._user);

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

    console.log("USER:", req._user);

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

        const ratings = await ratingService.getMyRatings(req._user.id);

        return successResponse(
            res,
            200,
            "Content ratings fetched successfully",
            ratings
        );
    };

}

module.exports = new RatingController();
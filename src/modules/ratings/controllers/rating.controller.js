const ratingService = require("../services/rating.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class RatingController {

    create = async (req, res) => {

        console.log("CREATE RATING HIT");

        const { rating, review } = req.body;

        const { profileId, contentId } = req.params;


        const ratingData = {
            userId: req._user.id,
            profileId,
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



    update = async (req, res) => {

        const { rating, review } = req.body;

        const { profileId, contentId } = req.params;


        const ratingData = {
            userId: req._user.id,
            profileId,
            contentId,
            rating,
            review
        };


        const ratingObj = await ratingService.update(ratingData);


        return successResponse(
            res,
            200,
            "Rating updated successfully",
            ratingObj
        );
    };



    getMyRating = async (req, res) => {

        console.log("GET MY RATING HIT");


        const rating = await ratingService.getMyRating(
            req._user.id,
            req.params.contentId
        );


        return successResponse(
            res,
            200,
            "Rating fetched successfully",
            rating
        );
    };



    getMyRatings = async (req, res) => {

        const ratings = await ratingService.getMyRatings(
            req._user.id
        );


        return successResponse(
            res,
            200,
            "Ratings fetched successfully",
            ratings
        );
    };



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

        await ratingService.deleteRating(
            req.params.id
        );


        return successResponse(
            res,
            200,
            "Rating deleted successfully"
        );
    };

}


module.exports = new RatingController();
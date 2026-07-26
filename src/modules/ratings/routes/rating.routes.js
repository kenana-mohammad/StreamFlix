const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");

const {
    createRatingValidation
} = require("../validations/rating.validation");

const {
    checkActiveSubscription
} = require("../../../middlewares/checkActiveSubscription");






// CREATE RATING
// POST /api/v1/profiles/:profileId/ratings/:contentId

router.post(
    "/:profileId/ratings/:contentId",
    [
        auth,
        checkActiveSubscription,
        ...createRatingValidation
    ],
    asyncHandler(ratingController.create)
);



// UPDATE RATING
// PUT /api/v1/profiles/:profileId/ratings/:contentId

router.put(
    "/:profileId/ratings/:contentId",
    [
        auth,
        checkActiveSubscription,
        ...createRatingValidation
    ],
    asyncHandler(ratingController.update)
);



// GET ALL PROFILE RATINGS
// GET /api/v1/profiles/:profileId/ratings

router.get(
    "/:profileId/ratings",
    [
        auth
    ],
    asyncHandler(ratingController.getMyRatings)
);



// GET MY RATING FOR CONTENT
// GET /api/v1/profiles/:profileId/ratings/:contentId

router.get(
    "/:profileId/ratings/:contentId",
    [
        auth
    ],
    asyncHandler(ratingController.getMyRating)
);



// GET CONTENT RATINGS
// GET /api/v1/profiles/contents/:contentId/rating

router.get(
    "/contents/:contentId/rating",
    asyncHandler(ratingController.getContentRating)
);


module.exports = router;
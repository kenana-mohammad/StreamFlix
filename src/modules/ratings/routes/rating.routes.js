const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");

const {
    createRatingValidation
} = require("../validations/rating.validation");
const { checkActiveSubscription } = require("./../../../middlewares/checkActiveSubscription");
router.get(
    "/contents/:contentId/rating",
    asyncHandler(ratingController.getContentRating)
);

// Create / Update Rating
router.post(
    "/:contentId", [auth, checkActiveSubscription, ...createRatingValidation],
    asyncHandler(ratingController.create)
);

// Get My Ratings
router.get(
    "/me",
    auth,
    asyncHandler(ratingController.getMyRatings)
);

// Get Ratings Of Content
router.get(
    "/contents/:contentId/rating",
    asyncHandler(ratingController.getContentRating)
);

module.exports = router;
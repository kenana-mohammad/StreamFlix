const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");

const {
    createRatingValidation
} = require("../validations/rating.validation");

// Create / Update Rating
router.post(
    "/",
    [auth, ...createRatingValidation],
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
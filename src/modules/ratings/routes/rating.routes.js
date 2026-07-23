const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");

const validate = require("../../../middlewares/validate");
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

router.post(
    "/:contentId", [auth, checkActiveSubscription, ...createRatingValidation],
    asyncHandler(ratingController.create)
);

// Front APIs
router.get(
    "/me",
    auth,
    asyncHandler(ratingController.getMyRatings)
);


module.exports = router;
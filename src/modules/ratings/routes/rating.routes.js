const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/Auth");
const validateProfileToken = require("../../../middlewares/validateProfileToken");

const {
    createRatingValidation
} = require("../validations/rating.validation");

const {
    checkActiveSubscription
} = require("../../../middlewares/checkActiveSubscription");

router.get(
    "/my-ratings",
    auth,
    validateProfileToken,
    asyncHandler(ratingController.getMyRatings)
);

router.post(
    "/:contentId",
    auth,
    validateProfileToken,
    checkActiveSubscription,
    ...createRatingValidation,
    asyncHandler(ratingController.createOrUpdate)
);



router.get(
    "/:contentId/my-rating",
    auth,
    validateProfileToken,
    asyncHandler(ratingController.getMyRating)
);







router.get(
    "/:contentId/all",
    asyncHandler(ratingController.getContentRatings)
);


module.exports = router;
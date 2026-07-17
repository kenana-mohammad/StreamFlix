const express = require("express");
const router = express.Router();

const ratingController = require("../controllers/rating.controller");

const validate = require("../../../middlewares/validate");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");

// Validation (سنضيفها بالخطوة القادمة)
const {
    createRatingValidation,
    updateRatingValidation
} = require("../validations/rating.validation");

// APIs
router.post(
    "/",
    [auth, ...createRatingValidation],
    asyncHandler(ratingController.create)
);

router.put(
    "/:contentId",
    [auth, ...updateRatingValidation],
    asyncHandler(ratingController.update)
);

router.delete(
    "/:contentId",
    auth,
    asyncHandler(ratingController.remove)
);

// Front APIs
router.get(
    "/me",
    auth,
    asyncHandler(ratingController.getMyRatings)
);

router.get(
    "/contents/:contentId/rating",
    asyncHandler(ratingController.getContentRating)
);

module.exports = router;
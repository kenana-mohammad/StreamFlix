const express = require("express");
const router = express.Router();


const asyncHandler = require("../../../utils/asyncHandler");

const ratingController = require("../controllers/rating.controller");
const { ROLES } = require("../../../shared/constants/roles.constant");
const role = require("../../../middlewares/Role");
const auth = require("../../../middlewares/Auth");

// =========================
// Recent Ratings
// =========================
router.get(
    "/recent",
    [auth, role(ROLES.SUPER_ADMIN)],
    asyncHandler(ratingController.getRecentRatings)
);

// =========================
// Delete Rating
// =========================
router.delete(
    "/:id",
    [auth, role(ROLES.SUPER_ADMIN)],
    asyncHandler(ratingController.deleteRating)
);

module.exports = router;
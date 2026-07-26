const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");
const asyncHandler = require("../../../utils/asyncHandler");

const ratingController = require("../controllers/rating.controller");
const { ROLES } = require("../../../shared/constants/roles.constant");

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
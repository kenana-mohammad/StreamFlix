const express = require("express");
const router = express.Router();

const WatchlistController = require("../controllers/watchlist.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/Auth");
const validateProfileToken = require("../../../middlewares/validateProfileToken");

const {
    addWatchlistValidation
} = require("../validations/watchlist.validation");


// ==========================================
// Watchlist Routes (تحتاج profile token فقط - بدون اشتراك)
// ==========================================

// إضافة محتوى للقائمة
// POST /api/v1/profiles/watchlist
router.post(
    "/watchlists",
    auth,
    validateProfileToken,
    ...addWatchlistValidation,
    asyncHandler(WatchlistController.add)
);


// حذف محتوى من القائمة
// DELETE /api/v1/profiles/watchlist/:contentId
router.delete(
    "/watchlists/:contentId",
    auth,
    validateProfileToken,
    asyncHandler(WatchlistController.remove)
);


// عرض قائمة المشاهدة
// GET /api/v1/profiles/watchlist
router.get(
    "/watchlists",
    auth,
    validateProfileToken,
    asyncHandler(WatchlistController.getAll)
);


module.exports = router;
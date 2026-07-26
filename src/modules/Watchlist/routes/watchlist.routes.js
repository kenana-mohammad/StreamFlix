const express = require("express");
const router = express.Router();

const WatchlistController = require("../controllers/watchlist.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");

const {
    addWatchlistValidation,
    deleteWatchlistValidation
} = require("../validations/watchlist.validation");


// Add Content To Watchlist
router.post(
    "/:profileId/watchlist",
    [
        auth,
        ...addWatchlistValidation
    ],
    asyncHandler(WatchlistController.add)
);


// Remove Content From Watchlist
router.delete(
    "/:profileId/watchlist/:contentId",
    [
        auth,
        ...deleteWatchlistValidation
    ],
    asyncHandler(WatchlistController.remove)
);


// Get Watchlist
router.get(
    "/:profileId/watchlist",
    [
        auth
    ],
    asyncHandler(WatchlistController.getAll)
);


module.exports = router;
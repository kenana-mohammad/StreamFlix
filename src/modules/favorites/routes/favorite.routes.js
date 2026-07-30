const router = require("express").Router();

const favoriteController = require("../controllers/favorite.controller");

const asyncHandler = require("../../../utils/asyncHandler");

const auth = require("../../../middlewares/Auth");


const {
    addFavoriteValidation,
    removeFavoriteValidation,
} = require("../validations/favorite.validation");
const validateProfileToken = require("../../../middlewares/validateProfileToken");

// ------------------------------------------
// Add Favorite
// ------------------------------------------
router.post(
    "/favorites",
        auth,validateProfileToken,
addFavoriteValidation,
    asyncHandler(favoriteController.addFavorite)
);

// ------------------------------------------
// Remove Favorite
// ------------------------------------------
router.delete(
    "/favorites/:contentId",
    removeFavoriteValidation,
    auth,validateProfileToken,
    asyncHandler(favoriteController.removeFavorite)
);

// ------------------------------------------   
// Get Favorites
// -------------------------------------------
router.get(
    "/favorites",
    auth,validateProfileToken,
    asyncHandler(favoriteController.getFavorites)
);

module.exports = router;
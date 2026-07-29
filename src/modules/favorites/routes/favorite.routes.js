const router = require("express").Router();

const favoriteController = require("../controllers/favorite.controller");

const asyncHandler = require("../../../utils/asyncHandler");

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");

const { ROLES } = require("../../../shared/constants/roles.constant");

const {
    addFavoriteValidation,
    removeFavoriteValidation,
    getFavoritesValidation
} = require("../validations/favorite.validation");

// ------------------------------------------
// Add Favorite
// ------------------------------------------
router.post(
    "/:profileId/favorites",
    addFavoriteValidation,
    auth,
    role([ROLES.USER]),
    asyncHandler(favoriteController.addFavorite)
);

// ------------------------------------------
// Remove Favorite
// ------------------------------------------
router.delete(
    "/:profileId/favorites/:contentId",
    removeFavoriteValidation,
    auth,
    role([ROLES.USER]),
    asyncHandler(favoriteController.removeFavorite)
);

// ------------------------------------------   
// Get Favorites
// -------------------------------------------
router.get(
    "/:profileId/favorites",
    getFavoritesValidation,
    auth,
    role([ROLES.USER]),
    asyncHandler(favoriteController.getFavorites)
);

module.exports = router;
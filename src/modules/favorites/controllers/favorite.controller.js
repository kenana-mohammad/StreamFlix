const favoriteService = require("../services/favorite.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class FavoriteController {

    // ---------------------------------------------
    // Add Favorite
    // ---------------------------------------------
    addFavorite = async (req, res) => {

        const { profileId } = req.params;
        const { contentId } = req.body;

        const data = await favoriteService.addFavorite(
            profileId,
            contentId,
            req._user.id
        );

        return successResponse(
            res,
            201,
            "Content added to favorites successfully",
            data
        );
    };

    //-------------------------------------------
    // Remove Favorite
    // ---------------------------------------------
    removeFavorite = async (req, res) => {

        const { profileId, contentId } = req.params;

        const data = await favoriteService.removeFavorite(
            profileId,
            contentId,
            req._user.id
        );

        return successResponse(
            res,
            200,
            "Content removed from favorites successfully",
            data
        );
    };

    // -------------------------------------------
    // Get Favorites
    // -------------------------------------------
    getFavorites = async (req, res) => {

        const { profileId } = req.params;

        const data = await favoriteService.getFavorites(
            profileId,
            req._user.id
        );

        return successResponse(
            res,
            200,
            "Favorites fetched successfully",
            data
        );
    };

}

module.exports = new FavoriteController();
const favoriteService = require("../services/favorite.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class FavoriteController {

    // ---------------------------------------------
    // Add Favorite
    // ---------------------------------------------
    addFavorite = async (req, res) => {

          const profileId = req.currentProfileId; 
        const { contentId } = req.body;
        const data = await favoriteService.addFavorite(
            profileId,
            contentId
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

        const {contentId } = req.params;
          const profileId = req.currentProfileId; 

        const data = await favoriteService.removeFavorite(
            profileId,
            contentId
        );

        return successResponse(
            res,
            200,
            "Content removed from favorites successfully"
            
        );
    };

    // -------------------------------------------
    // Get Favorites
    // -------------------------------------------
    getFavorites = async (req, res) => {

          const profileId = req.currentProfileId; 

        const data = await favoriteService.getFavorites(
            profileId,
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
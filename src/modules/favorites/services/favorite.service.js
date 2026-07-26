const Favorite = require("../models/Favorite");
const Profile = require("../../profiles/models/Profile");
const Content = require("../../content/models/Content");

const AppError = require("../../../shared/errors/AppError");

class FavoriteService {

    //------------------------------------------------------
    // Check Profile Ownership
    //------------------------------------------------------
    checkProfileOwnership = async (profileId, userId) => {
        const profile = await Profile.findById(profileId);

        console.log("profile,userId=", profile, userId);

        if (!profile) {
            throw new AppError("Profile not found", 404);
        }

        if (profile.userId.toString() !== userId.toString()) {
            throw new AppError(
                "You are not allowed to access this profile",
                403
            );
        }

        return profile;
    };

    //------------------------------------------------------
    // Add Favorite
    // ------------------------------------------------------
    addFavorite = async (profileId, contentId, userId) => {

        await this.checkProfileOwnership(profileId, userId);

        const content = await Content.findById(contentId);

        if (!content) {
            throw new AppError("Content not found", 404);
        }

        const exists = await Favorite.findOne({
            profileId,
            contentId,
        });

        if (exists) {
            throw new AppError(
                "Content already exists in favorites",
                409
            );
        }

        return await Favorite.create({
            profileId,
            contentId,
        });
    };

    //------------------------------------------------------
    // Remove Favorite
    //------------------------------------------------------
    removeFavorite = async (profileId, contentId, userId) => {

        await this.checkProfileOwnership(profileId, userId);

        const favorite = await Favorite.findOneAndDelete({
            profileId,
            contentId,
        });

        if (!favorite) {
            throw new AppError("Favorite not found", 404);
        }

        return favorite;
    };

    //------------------------------------------------------
    // Get Favorites
    //------------------------------------------------------
    getFavorites = async (profileId, userId) => {

        await this.checkProfileOwnership(profileId, userId);

        return await Favorite.find({ profileId })
            .populate("contentId", "title description poster type averageRating releaseYear")
            .sort({ createdAt: -1 });

    };

}

module.exports = new FavoriteService();
const WatchlistService = require("../services/watchlist.service");
const Profile = require("../../profiles/models/Profile");
const { successResponse } = require("../../../shared/helpers/api-response.helper");
const AppError = require("../../../shared/errors/AppError");

class WatchlistController {

    checkProfileOwnership = async (profileId, userId) => {
        const profile = await Profile.findOne({
            _id: profileId,
            userId: userId
        });

        if (!profile) {
            throw new AppError(
                "Invalid profile or unauthorized",
                403
            );
        }
    };


    add = async (req, res) => {
        const { profileId } = req.params;
        const { contentId } = req.body;

        await this.checkProfileOwnership(
            profileId,
            req._user.id
        );

        const watchlist = await WatchlistService.add(
            profileId,
            contentId
        );

        return successResponse(
            res,
            201,
            "Content added to watchlist successfully",
            watchlist
        );
    };


    remove = async (req, res) => {
        const { profileId, contentId } = req.params;

        await this.checkProfileOwnership(
            profileId,
            req._user.id
        );

        await WatchlistService.remove(
            profileId,
            contentId
        );

        return successResponse(
            res,
            200,
            "Content removed from watchlist successfully"
        );
    };


    getAll = async (req, res) => {
        const { profileId } = req.params;

        await this.checkProfileOwnership(
            profileId,
            req._user.id
        );

        const watchlist = await WatchlistService.getAll(
            profileId
        );

        return successResponse(
            res,
            200,
            "Watchlist fetched successfully",
            watchlist
        );
    };
}

module.exports = new WatchlistController();
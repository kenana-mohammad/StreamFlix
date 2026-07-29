const WatchlistService = require("../services/watchlist.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class WatchlistController {

    /**
     * POST /api/v1/profiles/watchlist
     */
    add = async (req, res) => {
        const profileId = req.currentProfileId; // من validateProfileToken
        const { contentId } = req.body;

        const watchlist = await WatchlistService.add(profileId, contentId);

        return successResponse(
            res,
            201,
            "Content added to watchlist successfully",
            watchlist
        );
    };


    /**
     * DELETE /api/v1/profiles/watchlist/:contentId
     */
    remove = async (req, res) => {
        const profileId = req.currentProfileId;
        const { contentId } = req.params;

        await WatchlistService.remove(profileId, contentId);

        return successResponse(
            res,
            200,
            "Content removed from watchlist successfully"
        );
    };


    /**     * GET /api/v1/profiles/watchlist
     */
    getAll = async (req, res) => {
        const profileId = req.currentProfileId;

        const watchlist = await WatchlistService.getAll(profileId);

        return successResponse(
            res,
            200,
            "Watchlist fetched successfully",
            watchlist
        );
    };
}

module.exports = new WatchlistController();
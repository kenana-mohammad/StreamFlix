const Watchlist = require("../model/Watchlist.model");
const Content = require("../../content/models/Content");
const AppError = require("../../../shared/errors/AppError");

class WatchlistService {

    add = async (profileId, contentId) => {

        const content = await Content.findById(contentId);

        if (!content) {
            throw new AppError(
                "Content not found",
                404
            );
        }


        const existing = await Watchlist.findOne({
            profileId,
            contentId
        });


        if (existing) {
            throw new AppError(
                "Content already exists in watchlist",
                400
            );
        }


        const watchlist = await Watchlist.create({
            profileId,
            contentId
        });


        return watchlist;
    };


    remove = async (profileId, contentId) => {

        const watchlist = await Watchlist.findOneAndDelete({
            profileId,
            contentId
        });


        if (!watchlist) {
            throw new AppError(
                "Content not found in watchlist",
                404
            );
        }

    };


    getAll = async (profileId) => {

        return await Watchlist.find({
            profileId
        })
        .populate("contentId")
        .sort({
            createdAt: -1
        });

    };

}


module.exports = new WatchlistService();
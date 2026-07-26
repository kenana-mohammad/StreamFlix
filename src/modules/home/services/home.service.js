const Content = require("../../content/models/Content");
const { CONTENT_TYPE } = require("../../../shared/constants/content-type.constant");
const { CONTENT_STATUS } = require("../../../shared/constants/content-status.constant");

class HomeService {

    getHomeData = async () => {

        const [
            latestMovies,
            latestSeries,
            topRated,
        ] = await Promise.all([

            Content.find({
                type: CONTENT_TYPE.MOVIE,
                status: CONTENT_STATUS.PUBLISHED,
            })
                .select("title poster averageRating releaseYear type")
                .sort({ createdAt: -1 })
                .limit(10),

            Content.find({
                type: CONTENT_TYPE.SERIES,
                status: CONTENT_STATUS.PUBLISHED,
            })
                .select("title poster averageRating releaseYear type")
                .sort({ createdAt: -1 })
                .limit(10),

            Content.find({
                status: CONTENT_STATUS.PUBLISHED,
            })
                .select("title poster averageRating releaseYear type")
                .sort({
                    averageRating: -1,
                    viewsCount: -1,
                })
                .limit(10),

        ]);

        return {
            latestMovies,
            latestSeries,
            topRated,
        };
    };
}

module.exports = new HomeService();
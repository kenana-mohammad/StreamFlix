const Content = require("../../content/models/Content");
const { CONTENT_TYPE } = require("../../../shared/constants/content-type.constant");
const { CONTENT_STATUS } = require("../../../shared/constants/content-status.constant");

class HomeService {

    getHomeData = async () => {

        const [latestMovies, latestSeries] = await Promise.all([
            Content.find({
                type: CONTENT_TYPE.MOVIE,
                status: CONTENT_STATUS.PUBLISHED
            })
                .sort({ createdAt: -1 })
                .limit(10),

            Content.find({
                type: CONTENT_TYPE.SERIES,
                status: CONTENT_STATUS.PUBLISHED
            })
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        return {
            latestMovies,
            latestSeries
        };
    };

}

module.exports = new HomeService();
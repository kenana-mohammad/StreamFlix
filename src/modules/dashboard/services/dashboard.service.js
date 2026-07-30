const User = require('../../users/models/User');
const Movie = require('../../content/models/Movie');
const Series = require('../../content/models/Series');
const Season = require('../../content/models/Season');
const Episode = require('../../content/models/Episode');
const Plan = require('../../plans/models/Plan');
const Rating = require('../../ratings/models/Rating');
const { USER_STATUS } = require('../../../shared/constants/user-status.constant');

class DashboardService {

    getStats = async() => {

        const [
            users,
            activeUsers,
            series,
            movies,
            seasons,
            episodes,
            plans
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: USER_STATUS.ACTIVE }),
            Series.countDocuments(),
            Movie.countDocuments(),
            Season.countDocuments(),
            Episode.countDocuments(),
            Plan.countDocuments()
        ]);

        return {
            users,
            activeUsers,
            series,
            movies,
            seasons,
            episodes,
            plans
        };
    }

    
    // Recent Ratings
    
    getRecentRatings = async () => {

        return await Rating.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({
                path: "profileId",
                select: "name"
            })
            .populate({
                path: "contentId",
                select: "title"
            });

    }

}

module.exports = new DashboardService();
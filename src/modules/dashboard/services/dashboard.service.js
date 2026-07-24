const User = require('../../users/models/User');
const Movie = require('../../content/models/Movie');
const Series = require('../../content/models/Series')
const Season = require('../../content/models/Season');
const Episode = require('../../content/models/Episode');
const Content = require('../../content/models/Content');
const WatchHistory = require('../../watch-history/models/WatchHistory');
const SubscriptionUsage = require('../../subscriptions/models/SubscriptionUsage');
const Plan = require('../../plans/models/Plan');
const { USER_STATUS } = require('../../../shared/constants/user-status.constant');

const ANALYTICS_CONTENT_LIMIT = 10;

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

        return { users, activeUsers, series, movies, seasons, episodes, plans };
    }

    getHistoryAnalytics = async() => {
        const [
            totalViewsResult,
            mostPopularContent,
            mostWatchedResult,
            viewingActivity
        ] = await Promise.all([
            Content.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: {
                            $sum: { $ifNull: ['$viewsCount', 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalViews: 1
                    }
                }
            ]),
            Content.aggregate([
                {
                    $sort: {
                        viewsCount: -1,
                        _id: 1
                    }
                },
                { $limit: ANALYTICS_CONTENT_LIMIT },
                {
                    $project: {
                        _id: 0,
                        content: {
                            _id: '$_id',
                            title: '$title',
                            type: '$type',
                            poster: '$poster'
                        },
                        globalViewsCount: {
                            $ifNull: ['$viewsCount', 0]
                        }
                    }
                }
            ]),
            WatchHistory.aggregate([
                {
                    $facet: {
                        mostWatchedContent: [
                            {
                                $group: {
                                    _id: '$contentId',
                                    profileHistoryCount: { $sum: 1 }
                                }
                            },
                            {
                                $lookup: {
                                    from: Content.collection.name,
                                    localField: '_id',
                                    foreignField: '_id',
                                    as: 'content'
                                }
                            },
                            { $unwind: '$content' },
                            {
                                $sort: {
                                    profileHistoryCount: -1,
                                    _id: 1
                                }
                            },
                            { $limit: ANALYTICS_CONTENT_LIMIT },
                            {
                                $project: {
                                    _id: 0,
                                    content: {
                                        _id: '$content._id',
                                        title: '$content.title',
                                        type: '$content.type',
                                        poster: '$content.poster'
                                    },
                                    profileHistoryCount: 1
                                }
                            }
                        ]
                    }
                }
            ]),
            SubscriptionUsage.aggregate([
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt',
                                timezone: 'UTC'
                            }
                        },
                        qualifyingNewViews: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        qualifyingNewViews: 1
                    }
                }
            ])
        ]);

        const {
            mostWatchedContent = []
        } = mostWatchedResult[0] || {};

        return {
            totalViews: totalViewsResult[0]?.totalViews || 0,
            mostWatchedContent,
            mostPopularContent,
            viewingActivity
        };
    }
}

module.exports = new DashboardService();

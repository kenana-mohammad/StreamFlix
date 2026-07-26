const mongoose = require('mongoose');
const Content = require('../../content/models/Content');
const contentService = require('../../content/services/content.service');
const Profile = require('../../profiles/models/Profile');
const subscriptionUsageService = require(
    '../../subscriptions/services/subscriptionUsage.service'
);
const AppError = require('../../../shared/errors/AppError');
const ContentViewEvent = require('../models/ContentViewEvent');
const WatchHistory = require('../models/WatchHistory');

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

const VIEW_ACTION = Object.freeze({
    NEW_VIEW: 'NEW_VIEW',
    RESUME: 'RESUME',
    PROGRESS_UPDATE: 'PROGRESS_UPDATE'
});

class WatchHistoryService {
    async getOwnedProfile(userId, profileId, session = null) {
        let query = Profile.findOne({
            _id: profileId,
            userId
        });

        if (session) {
            query = query.session(session);
        }

        const profile = await query;

        if (!profile) {
            throw new AppError('Profile not found or unauthorized.', 403);
        }

        return profile;
    }

    validateProgress(progress, totalDuration) {
        if (!Number.isFinite(progress) || progress < 0) {
            throw new AppError('Progress must be a non-negative number.', 400);
        }

        if (!Number.isFinite(totalDuration) || totalDuration < 1) {
            throw new AppError('Total duration must be at least 1.', 400);
        }

        if (progress > totalDuration) {
            throw new AppError('Progress cannot exceed total duration.', 400);
        }
    }

    async saveOrUpdateProgress(data) {
        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) {
            session.startTransaction();
        }

        try {
            const result = await this.recordViewingAction(data, session);

            if (session) {
                await session.commitTransaction();
            }

            return result;
        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async startNewViewingSession(data, content, existingHistory, session) {
        const {
            userId,
            profileId,
            contentId,
            progress,
            stoppedAt,
            totalDuration,
            episodeId,
            viewSessionId
        } = data;
        const effectiveViewSessionId = viewSessionId.toLowerCase();
        const initialProgress = progress === undefined ? 0 : Number(progress);
        const initialDuration = totalDuration === undefined && existingHistory ?
            Number(existingHistory.totalDuration) :
            Number(totalDuration);
        const sessionIdsToRemember = [
            existingHistory && existingHistory.viewSessionId ?
                String(existingHistory.viewSessionId).toLowerCase() :
                null,
            effectiveViewSessionId
        ].filter(Boolean);

        this.validateProgress(initialProgress, initialDuration);

        if (process.env.NODE_ENV === 'production' && !session) {
            throw new AppError(
                'Transactional viewing writes must be enabled in production.',
                503
            );
        }

        const usageResult = await subscriptionUsageService.consumeNewView({
            userId,
            profileId,
            contentId,
            contentType: content.type,
            viewSessionId: effectiveViewSessionId,
            session
        });

        if (!usageResult.consumed) {
            if (!existingHistory) {
                throw new AppError('Watch History item not found.', 404);
            }

            if (existingHistory.viewSessionId !== effectiveViewSessionId) {
                return {
                    action: VIEW_ACTION.RESUME,
                    history: existingHistory
                };
            }
        }

        const initialStoppedAt = stoppedAt === undefined ?
            null :
            new Date(stoppedAt);
        const viewedAt = new Date();
        const historyUpdate = {
            $set: {
                profileId,
                contentId,
                episodeId: episodeId === undefined ?
                    null :
                    episodeId || null,
                progressTime: initialProgress,
                totalDuration: initialDuration,
                completed: initialProgress >= initialDuration,
                stoppedAt: initialStoppedAt,
                watchedAt: initialStoppedAt || viewedAt,
                viewSessionId: effectiveViewSessionId
            },
            $addToSet: {
                viewSessionIds: {
                    $each: sessionIdsToRemember
                }
            }
        };

        if (usageResult.consumed) {
            historyUpdate.$push = {
                viewEvents: {
                    viewSessionId: effectiveViewSessionId,
                    viewedAt
                }
            };
        }

        const historyOptions = {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
        };

        if (session) {
            historyOptions.session = session;
        }

        const history = await WatchHistory.findOneAndUpdate(
            {
                profileId,
                contentId
            },
            historyUpdate,
            historyOptions
        );

        if (usageResult.consumed) {
            const viewEventOptions = {
                upsert: true,
                runValidators: true
            };
            if (session) {
                viewEventOptions.session = session;
            }

            await ContentViewEvent.updateOne(
                {
                    profileId,
                    contentId,
                    viewSessionId: effectiveViewSessionId
                },
                {
                    $setOnInsert: {
                        userId,
                        profileId,
                        contentId,
                        contentType: content.type,
                        subscriptionId: usageResult.subscription._id,
                        periodStart: usageResult.usage.periodStart,
                        periodEnd: usageResult.usage.periodEnd,
                        viewSessionId: effectiveViewSessionId,
                        viewedAt
                    }
                },
                viewEventOptions
            );

            const contentUpdateOptions = {};
            if (session) {
                contentUpdateOptions.session = session;
            }

            const updatedContent = await Content.findByIdAndUpdate(
                contentId,
                {
                    $inc: {
                        viewsCount: 1
                    }
                },
                contentUpdateOptions
            );

            if (!updatedContent) {
                throw new AppError(
                    'Content not found or not available.',
                    404
                );
            }
        }

        return {
            action: usageResult.consumed ?
                VIEW_ACTION.NEW_VIEW :
                VIEW_ACTION.RESUME,
            history
        };
    }

    async recordViewingAction(data, session = null) {
        const {
            userId,
            profileId,
            contentId,
            progress,
            stoppedAt,
            totalDuration,
            episodeId,
            viewSessionId
        } = data;
        const requestedViewSessionId = typeof viewSessionId === 'string' ?
            viewSessionId.trim().toLowerCase() :
            '';

        if (!requestedViewSessionId) {
            throw new AppError('View session ID is required.', 400);
        }

        await this.getOwnedProfile(userId, profileId, session);
        const content = await contentService.getContentById(contentId, false);

        let historyQuery = WatchHistory.findOne({
            profileId,
            contentId
        });

        if (session) {
            historyQuery = historyQuery.session(session);
        }

        const existingHistory = await historyQuery;
        const activeViewSessionId = existingHistory &&
            existingHistory.viewSessionId ?
            String(existingHistory.viewSessionId).toLowerCase() :
            null;
        const knownViewSessionIds = new Set(
            existingHistory ?
                [
                    activeViewSessionId,
                    ...(existingHistory.viewSessionIds || [])
                ]
                    .filter(Boolean)
                    .map(sessionId => String(sessionId).toLowerCase()) :
                  []
        );

        if (
            existingHistory &&
            requestedViewSessionId !== activeViewSessionId &&
            knownViewSessionIds.has(requestedViewSessionId)
        ) {
            return {
                action: VIEW_ACTION.RESUME,
                history: existingHistory
            };
        }

        if (
            !existingHistory ||
            requestedViewSessionId !== activeViewSessionId
        ) {
            let viewEventQuery = ContentViewEvent.findOne({
                profileId,
                contentId,
                viewSessionId: requestedViewSessionId
            }).select('_id');

            if (session) {
                viewEventQuery = viewEventQuery.session(session);
            }

            const knownViewEvent = await viewEventQuery;

            if (knownViewEvent) {
                if (!existingHistory) {
                    throw new AppError('Watch History item not found.', 404);
                }

                return {
                    action: VIEW_ACTION.RESUME,
                    history: existingHistory
                };
            }
        }

        const startsNewSession = !existingHistory ||
            requestedViewSessionId !== activeViewSessionId;

        if (startsNewSession) {
            return this.startNewViewingSession(
                {
                    ...data,
                    viewSessionId: requestedViewSessionId
                },
                content,
                existingHistory,
                session
            );
        }

        const nextProgress = progress === undefined ?
            existingHistory.progressTime :
            Number(progress);
        const nextDuration = totalDuration === undefined ?
            existingHistory.totalDuration :
            Number(totalDuration);

        this.validateProgress(nextProgress, nextDuration);

        const nextStoppedAt = stoppedAt === undefined ?
            existingHistory.stoppedAt :
            new Date(stoppedAt);
        const progressChanged = nextProgress !== existingHistory.progressTime;
        const durationChanged = nextDuration !== existingHistory.totalDuration;
        const stoppedAtChanged = stoppedAt !== undefined &&
            (
                !existingHistory.stoppedAt ||
                new Date(existingHistory.stoppedAt).getTime() !==
                    nextStoppedAt.getTime()
            );
        const episodeChanged = episodeId !== undefined &&
            String(existingHistory.episodeId || '') !==
                String(episodeId || '');

        existingHistory.progressTime = nextProgress;
        existingHistory.totalDuration = nextDuration;
        existingHistory.completed = nextProgress >= nextDuration;

        if (episodeId !== undefined) {
            existingHistory.episodeId = episodeId || null;
        }

        if (stoppedAt !== undefined) {
            existingHistory.stoppedAt = nextStoppedAt;
            existingHistory.watchedAt = nextStoppedAt;
        } else {
            existingHistory.watchedAt = new Date();
        }

        await existingHistory.save(session ? { session } : undefined);

        const action = (
            progressChanged ||
            durationChanged ||
            stoppedAtChanged ||
            episodeChanged
        ) ?
            VIEW_ACTION.PROGRESS_UPDATE :
            VIEW_ACTION.RESUME;

        return {
            action,
            history: existingHistory
        };
    }

    async getHistory(userId, profileId) {
        await this.getOwnedProfile(userId, profileId);

        return WatchHistory.find({ profileId })
            .populate('contentId')
            .populate('episodeId')
            .sort({ updatedAt: -1 });
    }

    async removeItem(userId, profileId, contentId) {
        await this.getOwnedProfile(userId, profileId);

        const history = await WatchHistory.findOneAndDelete({
            profileId,
            contentId
        });

        if (!history) {
            throw new AppError('Watch History item not found.', 404);
        }

        return history;
    }

    async clearAll(userId, profileId) {
        await this.getOwnedProfile(userId, profileId);

        const result = await WatchHistory.deleteMany({ profileId });

        return {
            deletedCount: result.deletedCount
        };
    }

    async getAnalytics() {
        const [
            totalViewsResult,
            mostWatchedContent,
            mostPopularContent,
            viewingActivity
        ] = await Promise.all([
            Content.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: {
                            $sum: '$viewsCount'
                        }
                    }
                }
            ]),
            ContentViewEvent.aggregate([
                {
                    $group: {
                        _id: '$contentId',
                        watchCount: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        watchCount: -1,
                        _id: 1
                    }
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: Content.collection.name,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'content'
                    }
                },
                {
                    $unwind: '$content'
                },
                {
                    $project: {
                        _id: 0,
                        contentId: '$_id',
                        title: '$content.title',
                        type: '$content.type',
                        watchCount: 1
                    }
                }
            ]),
            Content.find()
                .sort({
                    viewsCount: -1,
                    _id: 1
                })
                .limit(10)
                .select('title type poster viewsCount'),
            ContentViewEvent.aggregate([
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$viewedAt',
                                timezone: 'UTC'
                            }
                        },
                        activityCount: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        activityCount: 1
                    }
                }
            ])
        ]);

        return {
            totalViews: totalViewsResult[0] ?
                totalViewsResult[0].totalViews :
                0,
            mostWatchedContent,
            mostPopularContent,
            viewingActivity
        };
    }
}

const watchHistoryService = new WatchHistoryService();
watchHistoryService.VIEW_ACTION = VIEW_ACTION;

module.exports = watchHistoryService;

const mongoose = require('mongoose');
const Content = require('../../content/models/Content');
const contentService = require('../../content/services/content.service');
const Episode = require('../../content/models/Episode');
const Season = require('../../content/models/Season');
const Series = require('../../content/models/Series');
const Profile = require('../../profiles/models/Profile');
const subscriptionUsageService = require('../../subscriptions/services/subscriptionUsage.service');
const WatchHistory = require('../models/WatchHistory');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');
const { VIEW_ACTION } = require('../../../shared/constants/view-action.constant');

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

const attachSession = (query, session) => {
    return session ? query.session(session) : query;
};

const objectIdsEqual = (left, right) => {
    if (left == null || right == null) {
        return left == null && right == null;
    }

    return left.toString() === right.toString();
};

class WatchHistoryService {
    async assertProfileOwnership(userId, profileId, session = null) {
        const profile = await attachSession(Profile.findById(profileId), session);

        if (!profile) {
            throw new AppError('Profile not found', 404);
        }

        if (!objectIdsEqual(profile.userId, userId)) {
            throw new AppError('You are not authorized to access this profile', 403);
        }

        return profile;
    }

    async getContent(contentId, session = null) {
        return contentService.getContentById(
            contentId,
            false,
            { session }
        );
    }

    async assertEpisodeBelongsToContent(content, episodeId, session = null) {
        if (episodeId == null) {
            return;
        }

        if (content.type !== CONTENT_TYPE.SERIES) {
            throw new AppError('Episodes can only be used with Series content', 400);
        }

        const episode = await attachSession(Episode.findById(episodeId), session);

        if (!episode) {
            throw new AppError('Episode not found', 404);
        }

        const season = await attachSession(Season.findById(episode.seasonId), session);

        if (!season) {
            throw new AppError('Episode season not found', 404);
        }

        const series = await attachSession(Series.findOne({
            _id: season.seriesId,
            contentId: content._id
        }), session);

        if (!series) {
            throw new AppError('Episode does not belong to the selected content', 400);
        }
    }

    normalizeViewingData({ progress, totalDuration, stoppedAt, episodeId }) {
        const progressTime = Number(progress);
        const normalizedDuration = Number(totalDuration);
        const watchedAt = stoppedAt == null ? new Date() : new Date(stoppedAt);

        if (!Number.isFinite(progressTime) || progressTime < 0) {
            throw new AppError('Progress must be a non-negative number', 400);
        }

        if (!Number.isFinite(normalizedDuration) || normalizedDuration < 1) {
            throw new AppError('Total duration must be at least 1', 400);
        }

        if (progressTime > normalizedDuration) {
            throw new AppError('Progress cannot exceed total duration', 400);
        }

        if (Number.isNaN(watchedAt.getTime())) {
            throw new AppError('StoppedAt must be a valid date', 400);
        }

        return {
            progressTime,
            totalDuration: normalizedDuration,
            watchedAt,
            episodeId,
            completed: progressTime >= normalizedDuration
        };
    }

    classifyExistingHistory(history, viewingData) {
        const nextEpisodeId = viewingData.episodeId === undefined ?
            history.episodeId :
            viewingData.episodeId;
        const progressChanged = (
            history.progressTime !== viewingData.progressTime ||
            history.totalDuration !== viewingData.totalDuration ||
            !objectIdsEqual(history.episodeId, nextEpisodeId)
        );

        return progressChanged ?
            VIEW_ACTION.PROGRESS_UPDATE :
            VIEW_ACTION.RESUME;
    }

    applyViewingData(history, viewingData) {
        history.progressTime = viewingData.progressTime;
        history.totalDuration = viewingData.totalDuration;
        if (viewingData.episodeId !== undefined) {
            history.episodeId = viewingData.episodeId;
        }
        history.completed = viewingData.completed;
        history.watchedAt = viewingData.watchedAt;
    }

    async recordViewing(viewingRequest) {
        if (!useTransaction) {
            if (process.env.NODE_ENV === 'production') {
                throw new AppError(
                    'USE_TRANSACTIONS must be enabled for production viewing operations',
                    500
                );
            }

            return this._recordViewing(viewingRequest);
        }

        const session = await mongoose.startSession();
        let result;

        try {
            await session.withTransaction(async() => {
                result = await this._recordViewing(viewingRequest, session);
            });

            return result;
        } finally {
            await session.endSession();
        }
    }

    async _recordViewing({
        userId,
        profileId,
        contentId,
        progress,
        totalDuration,
        stoppedAt,
        episodeId
    }, session = null) {
        let consumption = null;
        let createdHistoryId = null;

        try {
            await this.assertProfileOwnership(userId, profileId, session);
            const content = await this.getContent(contentId, session);
            const viewingData = this.normalizeViewingData({
                progress,
                totalDuration,
                stoppedAt,
                episodeId
            });

            await this.assertEpisodeBelongsToContent(content, viewingData.episodeId, session);

            const existingHistory = await attachSession(WatchHistory.findOne({
                profileId,
                contentId
            }), session);

            if (existingHistory) {
                // A retained profile/content record is a resume across plan
                // periods; renewed allowances apply only to newly watched content.
                await subscriptionUsageService.assertActiveEntitlement(userId, session);
                const action = this.classifyExistingHistory(existingHistory, viewingData);
                this.applyViewingData(existingHistory, viewingData);
                await existingHistory.save({ session });

                return {
                    action,
                    history: existingHistory,
                    usageConsumed: false,
                    viewsIncremented: false
                };
            }

            consumption = await subscriptionUsageService.consumeViewAllowance({
                userId,
                profileId,
                contentId,
                contentType: content.type,
                session
            });

            const historyResult = await WatchHistory.findOneAndUpdate(
                { profileId, contentId },
                {
                    $set: {
                        episodeId: viewingData.episodeId ?? null,
                        progressTime: viewingData.progressTime,
                        totalDuration: viewingData.totalDuration,
                        completed: viewingData.completed,
                        watchedAt: viewingData.watchedAt
                    },
                    $setOnInsert: {
                        profileId,
                        contentId
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                    includeResultMetadata: true,
                    session
                }
            );

            const history = historyResult.value;
            createdHistoryId = historyResult.lastErrorObject?.upserted ?
                history._id :
                null;

            if (consumption.isNewUsage) {
                const updatedContent = await Content.findByIdAndUpdate(
                    contentId,
                    { $inc: { viewsCount: 1 } },
                    { new: true, session }
                );

                if (!updatedContent) {
                    throw new AppError('Content not found', 404);
                }
            }

            return {
                action: consumption.isNewUsage ?
                    VIEW_ACTION.NEW_VIEW :
                    VIEW_ACTION.RESUME,
                history,
                usageConsumed: consumption.isNewUsage,
                viewsIncremented: consumption.isNewUsage
            };
        } catch (error) {
            if (!session && consumption?.isNewUsage) {
                try {
                    if (createdHistoryId) {
                        await WatchHistory.deleteOne({ _id: createdHistoryId });
                    }

                    await subscriptionUsageService.rollbackViewAllowance(consumption);
                } catch (compensationError) {
                    error.compensationError = compensationError;
                }
            }

            throw error;
        }
    }

    async getHistory(userId, profileId) {
        await this.assertProfileOwnership(userId, profileId);

        const history = await WatchHistory.find({ profileId })
            .populate({
                path: 'contentId',
                match: { status: CONTENT_STATUS.PUBLISHED }
            })
            .populate('episodeId')
            .sort({ watchedAt: -1 });

        return history.filter((item) => item.contentId);
    }

    async deleteHistoryItem(userId, profileId, contentId) {
        await this.assertProfileOwnership(userId, profileId);

        const history = await WatchHistory.findOneAndDelete({
            profileId,
            contentId
        });

        if (!history) {
            throw new AppError('Watch history item not found', 404);
        }

        return history;
    }

    async deleteAllHistory(userId, profileId) {
        await this.assertProfileOwnership(userId, profileId);

        const result = await WatchHistory.deleteMany({ profileId });

        return {
            deletedCount: result.deletedCount
        };
    }
}

module.exports = new WatchHistoryService();

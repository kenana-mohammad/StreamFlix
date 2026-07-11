const Episode = require('../models/Episode');
const Season = require('../models/Season');
const AppError = require('../../../shared/errors/AppError');

class EpisodeService {
    async createEpisode(data) {
        const seasonExists = await Season.findById(data.seasonId);
        if (!seasonExists) {
            throw new AppError('Season not found', 404);
        }

        const episode = await Episode.create({
            seasonId: data.seasonId,
            episodeNumber: data.episodeNumber,
            title: data.title,
            description: data.description,
            duration: data.duration,
            videoUrl: data.videoUrl
        });

        return episode;
    }

    async getEpisodeById(id, isAdmin = false) {
    const CONTENT_STATUS = require('../../../shared/constants/content-status.constant');
    const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };
    
    const episode = await Episode.findOne({ _id: id, ...matchCondition });
    
    if (!episode) {
        throw new AppError('Episode not found or not available', 404);
    }
    
    return episode;
}

    async getEpisodesBySeasonId(seasonId, isAdmin = false) {
    const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');
    const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };
    return await Episode.find({ seasonId, ...matchCondition }).sort({ episodeNumber: 1 });
}

    async updateEpisode(id, data) {
        const episode = await Episode.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!episode) throw new AppError('Episode not found', 404);
        return episode;
    }

    async changeStatus(id, status) {
        const episode = await Episode.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!episode) throw new AppError('Episode not found', 404);
        return episode;
    }

    async deleteEpisode(id) {
        const episode = await Episode.findByIdAndDelete(id);
        if (!episode) throw new AppError('Episode not found', 404);
        return true;
    }
}

module.exports = new EpisodeService();
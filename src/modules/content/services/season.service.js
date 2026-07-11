const mongoose = require('mongoose');
const Season = require('../models/Season');
const Series = require('../models/Series');
const Episode = require('../models/Episode');
const AppError = require('../../../shared/errors/AppError');

class SeasonService {
    async createSeason(data) {
        const seriesExists = await Series.findById(data.seriesId);
        if (!seriesExists) {
            throw new AppError('Series not found', 404);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const season = await Season.create([{
                seriesId: data.seriesId,
                seasonNumber: data.seasonNumber,
                title: data.title,
            }], { session });

            await Series.findByIdAndUpdate(
                data.seriesId,
                { $inc: { totalSeasons: 1 } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return season[0];
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async getSeasonsBySeriesId(seriesId, isAdmin = false) {
        const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };
        return await Season.find({ seriesId, ...matchCondition }).sort({ seasonNumber: 1 });
    }

    async updateSeason(id, data) {
        const season = await Season.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!season) throw new AppError('Season not found', 404);
        return season;
    }

    async changeStatus(id, status) {
        const season = await Season.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!season) throw new AppError('Season not found', 404);
        return season;
    }
    
    async deleteSeason(id) {
        const season = await Season.findById(id);
        if (!season) throw new AppError('Season not found', 404);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await Episode.deleteMany({ seasonId: id }, { session });

            await Series.findByIdAndUpdate(
                season.seriesId,
                { $inc: { totalSeasons: -1 } },
                { session }
            );

            await Season.findByIdAndDelete(id, { session });
            
            await session.commitTransaction();
            session.endSession();
            return true;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

module.exports = new SeasonService();
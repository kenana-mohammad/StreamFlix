const mongoose = require('mongoose');
const Content = require('../models/Content');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

class SeriesService {
    async createSeries(data) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const content = await Content.create([{
                title: data.title,
                description: data.description,
                type: CONTENT_TYPE.SERIES,
                poster: data.poster,
                ageRating: data.ageRating,
                trailerUrl: data.trailerUrl,
                releaseYear: data.releaseYear,
                status: data.status || CONTENT_STATUS.DRAFT,
                publishAt: data.publishAt
            }], { session });

            const series = await Series.create([{
                contentId: content[0]._id
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return { series: series[0], content: content[0] };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async getSeries(isAdmin = false) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };
        const series = await Series.find().populate({
            path: 'contentId',
            match: matchCondition
        })
        .populate({
            path: 'seasons',
            match: matchCondition,
            populate: {
                path: 'episodes',
                match: matchCondition,
            }
        });
        return series.filter(s => s.contentId !== null);
    }

    async getSeriesById(id, isAdmin = false) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };
        const series = await Series.findById(id)
        .populate({
            path: 'contentId',
            match: matchCondition
        })
        .populate({
            path: 'seasons',
            match: matchCondition,
            populate: {
                path: 'episodes',
                match: matchCondition
            }
        });

        if (!series || !series.contentId) {
            throw new AppError('Series not found or not available', 404);
        }
        return series;
    }

    async updateSeries(id, data) {
        const series = await Series.findById(id);
        if (!series) throw new AppError('Series not found', 404);

        const contentFields = ['title', 'description', 'poster', 'ageRating', 'trailerUrl', 'releaseYear'];
        const contentData = {};
        const seriesData = {};

        for (const key in data) {
            if (contentFields.includes(key)) contentData[key] = data[key];
            else seriesData[key] = data[key];
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (Object.keys(contentData).length > 0) {
                await Content.findByIdAndUpdate(series.contentId, contentData, { new: true, runValidators: true, session });
            }
            if (Object.keys(seriesData).length > 0) {
                await Series.findByIdAndUpdate(id, seriesData, { new: true, runValidators: true, session });
            }
            
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

        return await this.getSeriesById(id, true);
    }

    async changeStatus(id, status) {
        const series = await Series.findById(id);
        if (!series) throw new AppError('Series not found', 404);

        await Content.findByIdAndUpdate(series.contentId, { status }, { runValidators: true });
        return await this.getSeriesById(id, true);
    }

    async deleteSeries(id) {
        const series = await Series.findById(id);
        if (!series) throw new AppError('Series not found', 404);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await Episode.deleteMany({ seriesId: id }, { session });

            await Season.deleteMany({ seriesId: id }, { session });

            await Content.findByIdAndDelete(series.contentId, { session });

            await Series.findByIdAndDelete(id, { session });

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

module.exports = new SeriesService();
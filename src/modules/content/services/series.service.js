const mongoose = require('mongoose');
const Content = require('../models/Content');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

// Relations Models
const ContentGenre = require('../models/ContentGenre');
const ContentCast = require('../models/ContentCast');

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

class SeriesService {
    async createSeries(data) {

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            const now = new Date();
            let status = data.status || CONTENT_STATUS.DRAFT;

            if (data.publishAt && new Date(data.publishAt) > now) {
                status = CONTENT_STATUS.DRAFT;
            } else {
                status = CONTENT_STATUS.PUBLISHED;
            }
            const content = await Content.create([{
                title: data.title,
                description: data.description,
                type: CONTENT_TYPE.SERIES,
                poster: data.poster,
                ageRating: data.ageRating,
                trailerUrl: data.trailerUrl,
                releaseYear: data.releaseYear,
                status: status,
                publishAt: data.publishAt
            }], { session });

            const series = await Series.create([{
                contentId: content[0]._id
            }], { session });

            // إضافة التصنيفات والممثلين إذا وجدوا
            if (data.genres && data.genres.length > 0) {
                const genreDocs = data.genres.map(genreId => ({ contentId: content[0]._id, genreId }));
                await ContentGenre.insertMany(genreDocs, { session });
            }

            if (data.cast && data.cast.length > 0) {
                const castDocs = data.cast.map(c => ({ contentId: content[0]._id, castId: c.castId, characterName: c.characterName }));
                await ContentCast.insertMany(castDocs, { session });
            }

            if (session) await session.commitTransaction();
            if (session) session.endSession();

            return { series: series[0], content: content[0] };
        } catch (error) {
            if (session) await session.abortTransaction();
            if (session) session.endSession();
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

        if (data.publishAt !== undefined) {
            const now = new Date();
            const publishDate = new Date(data.publishAt);


            data.status = (publishDate <= now) ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT;
        }
        const contentFields = ['title', 'description', 'poster', 'ageRating', 'trailerUrl', 'releaseYear', 'status', 'publishAt'];
        const contentData = {};
        const seriesData = {};

        for (const key in data) {
            if (contentFields.includes(key)) contentData[key] = data[key];
            else seriesData[key] = data[key];
        }

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            if (Object.keys(contentData).length > 0) {
                await Content.findByIdAndUpdate(series.contentId, contentData, { new: true, runValidators: true, session });
            }
            if (Object.keys(seriesData).length > 0) {
                await Series.findByIdAndUpdate(id, seriesData, { new: true, runValidators: true, session });
            }

            if (session) await session.commitTransaction();
            if (session) session.endSession();
        } catch (error) {
            if (session) await session.abortTransaction();
            if (session) session.endSession();
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

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            // استخدام Promise.all
            await Promise.all([
                Episode.deleteMany({ seriesId: id }, { session }),
                Season.deleteMany({ seriesId: id }, { session }),
                Series.findByIdAndDelete(id, { session }),
                Content.findByIdAndDelete(series.contentId, { session })
            ]);

            if (session) {
                await session.commitTransaction();
                session.endSession();
            }
            return true;
        } catch (error) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            throw error;
        }
    }
}

module.exports = new SeriesService();
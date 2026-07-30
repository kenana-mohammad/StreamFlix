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
                status: data.status || status,
                publishAt: data.publishAt
            }], { session });

            const series = await Series.create([{
    contentId: content[0]._id,
    totalSeasons: 0
}], { session });

            let savedGenres = [];
            let savedCasts = [];

            // إضافة التصنيفات إذا تم تمريرها
            if (data.genres && data.genres.length > 0) {
                const genreDocs = data.genres.map(genreId => ({ contentId: content[0]._id, genreId }));
                await ContentGenre.insertMany(genreDocs, { session });
                savedGenres = await ContentGenre.find({ contentId: content[0]._id }).populate('genreId').session(session);
                savedGenres = savedGenres.map(g => g.genreId);
            }

            // إضافة الممثلين إذا تم تمريرهم
            if (data.casts && data.casts.length > 0) {
                const castDocs = data.casts.map(c => ({ contentId: content[0]._id, castId: c.castId, characterName: c.characterName }));
                await ContentCast.insertMany(castDocs, { session });
                savedCasts = await ContentCast.find({ contentId: content[0]._id }).populate('castId').session(session);
                savedCasts = savedCasts.map(c => ({
                    _id: c._id,
                    actor: c.castId,
                    characterName: c.characterName
                }));
            }

            if (session) await session.commitTransaction();
            if (session) session.endSession();

            return {
                series: {
                    ...series[0].toObject(),
                    contentId: content[0]
                },
                genres: savedGenres,
                casts: savedCasts
            };
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

        const filteredSeries = series.filter(
            series => series.contentId !== null
        );

        const seriesWithDetails = await Promise.all(
            filteredSeries.map(async (series) => {
                const contentId = series.contentId._id;

                // Get genres
                const genreLinks = await ContentGenre.find({ contentId })
                    .populate('genreId');
                const genres = genreLinks.map(link => link.genreId);

                // Get cast
                const castLinks = await ContentCast.find({ contentId })
                    .populate('castId');
                const casts = castLinks.map(link => ({
                    _id: link._id,
                    actor: link.castId,
                    characterName: link.characterName
                }));

                return {
                    ...series.toObject(),
                    genres,
                    casts
                };
            })
        );

        return seriesWithDetails;
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

        // التحقق من حالة النشر إذا لم يكن المشاهد Admin
        if (!isAdmin && series.contentId.status !== CONTENT_STATUS.PUBLISHED) {
            throw new AppError('Series not found or not available', 404);
        }

        const contentId = series.contentId._id;

        // جلب التصنيفات المرتبطة
        const genreLinks = await ContentGenre.find({ contentId })
            .populate('genreId');
        const genres = genreLinks.map(link => link.genreId);

        // جلب الممثلين المرتبطين
        const castLinks = await ContentCast.find({ contentId })
            .populate('castId');
        const casts = castLinks.map(link => ({
            _id: link._id,
            actor: link.castId,
            characterName: link.characterName
        }));

        return {
            ...series.toObject(),
            genres,
            casts
        };
    }

    async updateSeries(id, data) {
        const series = await Series.findById(id);
        if (!series) throw new AppError('Series not found', 404);

        const contentId = series.contentId;

        if (data.publishAt !== undefined) {
            const now = new Date();
            const publishDate = new Date(data.publishAt);
            data.status = (publishDate <= now) ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT;
        }

        const contentFields = ['title', 'description', 'poster', 'ageRating', 'trailerUrl', 'releaseYear', 'status', 'publishAt'];

        const contentData = {};

        for (const key in data) {
            if (contentFields.includes(key)) {
                contentData[key] = data[key];
            } 
        }

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            if (Object.keys(contentData).length > 0) {
                await Content.findByIdAndUpdate(contentId, contentData, { new: true, runValidators: true, session });
            }

            // تحديث الأصناف (Genres): حذف القديم وإدخال الجديد
            if (data.genres !== undefined) {
                await ContentGenre.deleteMany({ contentId }, { session });
                if (Array.isArray(data.genres) && data.genres.length > 0) {
                    const genreDocs = data.genres.map(genreId => ({ contentId, genreId }));
                    await ContentGenre.insertMany(genreDocs, { session });
                }
            }

            // تحديث الممثلين (Cast): حذف القديم وإدخال الجديد
            if (data.casts !== undefined) {
                await ContentCast.deleteMany({ contentId }, { session });
                if (Array.isArray(data.casts) && data.casts.length > 0) {
                    const castDocs = data.casts.map(c => ({
                        contentId,
                        castId: c.castId,
                        characterName: c.characterName
                    }));
                    await ContentCast.insertMany(castDocs, { session });
                }
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
            await Promise.all([
                Episode.deleteMany({ seriesId: id }, { session }),
                Season.deleteMany({ seriesId: id }, { session }),
                Series.findByIdAndDelete(id, { session }),
                Content.findByIdAndDelete(series.contentId, { session }),
                ContentGenre.deleteMany({ contentId: series.contentId }, { session }),
                ContentCast.deleteMany({ contentId: series.contentId }, { session })
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
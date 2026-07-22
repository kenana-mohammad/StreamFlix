const mongoose = require('mongoose');
const Content = require('../models/Content');
const Movie = require('../models/Movie');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

// Relations Models
const ContentGenre = require('../models/ContentGenre');
const ContentCast = require('../models/ContentCast');

const useTransaction = process.env.USE_TRANSACTIONS === 'true';

class MovieService {
    async getMovieById(id, isAdmin = false) {
        const movie = await Movie.findById(id).populate('contentId');
        if (!movie) throw new AppError('Movie not found', 404);

        // التحقق من حالة النشر إذا لم يكن المشاهد Admin
        if (!isAdmin && movie.contentId.status !== CONTENT_STATUS.PUBLISHED) {
            throw new AppError('Movie not found', 404);
        }

        const contentId = movie.contentId._id;

        // جلب التصنيفات والممثلين المرتبطين
        const genreLinks = await ContentGenre.find({ contentId }).populate('genreId');
        const genres = genreLinks.map(link => link.genreId);

        const castLinks = await ContentCast.find({ contentId }).populate('castId');
        const cast = castLinks.map(link => ({
            _id: link._id,
            actor: link.castId,
            characterName: link.characterName
        }));

        return {
            ...movie.toObject(),
            genres,
            cast
        };
    }
    async createMovie(data) {
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
                type: CONTENT_TYPE.MOVIE,
                poster: data.poster,
                ageRating: data.ageRating,
                trailerUrl: data.trailerUrl,
                releaseYear: data.releaseYear,
                status: data.status || status,
                publishAt: data.publishAt
            }], { session });

            const movie = await Movie.create([{
                contentId: content[0]._id,
                duration: data.duration || null,
                videoUrl: data.videoUrl
            }], { session });

            // مصفوفات لتخزين الوثائق المضافة لربطها في الاستجابة المباشرة
            let savedGenres = [];
            let savedCast = [];

            // إضافة التصنيفات إذا تم تمريرها
            if (data.genres && data.genres.length > 0) {
                const genreDocs = data.genres.map(genreId => ({ contentId: content[0]._id, genreId }));
                await ContentGenre.insertMany(genreDocs, { session });
                // جلب الأصناف مع بياناتها الأصلية لإرجاعها
                savedGenres = await ContentGenre.find({ contentId: content[0]._id }).populate('genreId').session(session);
                savedGenres = savedGenres.map(g => g.genreId);
            }

            // إضافة الممثلين إذا تم تمريرهم
            if (data.cast && data.cast.length > 0) {
                const castDocs = data.cast.map(c => ({ contentId: content[0]._id, castId: c.castId, characterName: c.characterName }));
                await ContentCast.insertMany(castDocs, { session });
                // جلب الممثلين مع بياناتهم الأصلية لإرجاعهم
                savedCast = await ContentCast.find({ contentId: content[0]._id }).populate('castId').session(session);
                savedCast = savedCast.map(c => ({
                    _id: c._id,
                    actor: c.castId,
                    characterName: c.characterName
                }));
            }

            if (session) await session.commitTransaction();
            if (session) session.endSession();

            // إرجاع النتيجة كاملة ومكتملة بجدول الربط
            return {
                movie: {
                    ...movie[0].toObject(),
                    contentId: content[0]
                },
                genres: savedGenres,
                cast: savedCast
            };
        } catch (error) {
            if (session) await session.abortTransaction();
            if (session) session.endSession();
            throw error;
        }
    }
    async updateMovie(id, data) {
        const movie = await Movie.findById(id);
        if (!movie) throw new AppError('Movie not found', 404);

        const contentId = movie.contentId;

        if (data.publishAt !== undefined) {
            const now = new Date();
            const publishDate = new Date(data.publishAt);
            data.status = (publishDate <= now) ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT;
        }

        const contentFields = ['title', 'description', 'poster', 'ageRating', 'trailerUrl', 'releaseYear', 'status', 'publishAt'];
        const movieFields = ['duration', 'videoUrl'];

        const contentData = {};
        const movieData = {};

        for (const key in data) {
            if (contentFields.includes(key)) {
                contentData[key] = data[key];
            } else if (movieFields.includes(key)) {
                movieData[key] = data[key];
            }
        }

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            if (Object.keys(contentData).length > 0) {
                await Content.findByIdAndUpdate(contentId, contentData, { new: true, runValidators: true, session });
            }

            if (Object.keys(movieData).length > 0) {
                await Movie.findByIdAndUpdate(id, movieData, { new: true, runValidators: true, session });
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
            if (data.cast !== undefined) {
                console.log("Updating Cast with data:", data.cast);
                await ContentCast.deleteMany({ contentId }, { session });
                if (Array.isArray(data.cast) && data.cast.length > 0) {
                    const castDocs = data.cast.map(c => ({
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

        return await this.getMovieById(id, true);
    }

    async changeStatus(id, status) {
        const movie = await Movie.findById(id);
        if (!movie) throw new AppError('Movie not found', 404);

        await Content.findByIdAndUpdate(movie.contentId, { status }, { runValidators: true });
        return await this.getMovieBy
        Id(id, true);
    }

    async deleteMovie(id) {
        const movie = await Movie.findById(id);
        if (!movie) throw new AppError('Movie not found', 404);

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();

        try {
            // إضافة Promise.all 
            await Promise.all([
                Movie.findByIdAndDelete(id, { session }),
                Content.findByIdAndDelete(movie.contentId, { session })
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

module.exports = new MovieService();
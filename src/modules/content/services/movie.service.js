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
            let savedCasts = [];

            // إضافة التصنيفات إذا تم تمريرها
            if (data.genres && data.genres.length > 0) {
                const genreDocs = data.genres.map(genreId => ({ contentId: content[0]._id, genreId }));
                await ContentGenre.insertMany(genreDocs, { session });
                // جلب الأصناف مع بياناتها الأصلية لإرجاعها
                savedGenres = await ContentGenre.find({ contentId: content[0]._id }).populate('genreId').session(session);
                savedGenres = savedGenres.map(g => g.genreId);
            }

            // إضافة الممثلين إذا تم تمريرهم
            if (data.casts && data.casts.length > 0) {
                const castDocs = data.casts.map(c => ({ contentId: content[0]._id, castId: c.castId, characterName: c.characterName }));
                await ContentCast.insertMany(castDocs, { session });
                // جلب الممثلين مع بياناتهم الأصلية لإرجاعهم
                savedCasts = await ContentCast.find({ contentId: content[0]._id }).populate('castId').session(session);
                savedCasts = savedCasts.map(c => ({
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
                casts: savedCasts
            };
        } catch (error) {
            if (session) await session.abortTransaction();
            if (session) session.endSession();
            throw error;
        }
    }
    async getMovies(isAdmin = false) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };

        const movies = await Movie.find().populate({
            path: 'contentId',
            match: matchCondition
        });

        const filteredMovies = movies.filter(
            movie => movie.contentId !== null
        );

        const moviesWithDetails = await Promise.all(
            filteredMovies.map(async(movie) => {
                const contentId = movie.contentId._id;

                // Get genres
                const genreLinks = await ContentGenre.find({ contentId })
                    .populate('genreId');

                const genres = genreLinks.map(
                    link => link.genreId
                );

                // Get cast
                const castLinks = await ContentCast.find({ contentId })
                    .populate('castId');

                const casts = castLinks.map(link => ({
                    _id: link._id,
                    actor: link.castId,
                    characterName: link.characterName
                }));

                return {
                    ...movie.toObject(),
                    genres,
                    casts
                };
            })
        );

        return moviesWithDetails;
    }

    async getMovieById(id, isAdmin = false) {
        const movie = await Movie.findById(id).populate('contentId');

        if (!movie || !movie.contentId) {
            throw new AppError('Movie not found', 404);
        }

        // التحقق من حالة النشر إذا لم يكن المشاهد Admin
        if (!isAdmin && movie.contentId.status !== CONTENT_STATUS.PUBLISHED) {
            throw new AppError('Movie not found', 404);
        }

        const contentId = movie.contentId._id;

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
            ...movie.toObject(),
            genres,
            casts
        };
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

            // تحديث الأصناف (Genres): دعم كلا الاحتمالين وعدم الحذف إلا إذا تم إرسال المفتاح صراحة
            const genresInput = data.genres !== undefined ? data.genres : data.genre;
            if (genresInput !== undefined) {
                await ContentGenre.deleteMany({ contentId }, { session });
                if (Array.isArray(genresInput) && genresInput.length > 0) {
                    const genreDocs = genresInput.map(genreId => ({ contentId, genreId }));
                    await ContentGenre.insertMany(genreDocs, { session });
                }
            }

            // تحديث الممثلين (Cast / Casts): دعم كلا الاحتمالين وعدم الحذف إلا إذا تم إرسال المفتاح صراحة
            const castInput = data.casts !== undefined ? data.casts : data.cast;
            if (castInput !== undefined) {
                console.log("Updating Cast with data:", castInput);
                await ContentCast.deleteMany({ contentId }, { session });
                if (Array.isArray(castInput) && castInput.length > 0) {
                    const castDocs = castInput.map(c => ({
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
        return await this.getMovieById(id, true);
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
                Content.findByIdAndDelete(movie.contentId, { session }),
                ContentGenre.deleteMany({ contentId: movie.contentId }, { session }),
                ContentCast.deleteMany({ contentId: movie.contentId }, { session })
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
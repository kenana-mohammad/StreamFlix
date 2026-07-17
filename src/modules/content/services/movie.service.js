const mongoose = require('mongoose');
const Content = require('../models/Content');
const Movie = require('../models/Movie');
const AppError = require('../../../shared/errors/AppError');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

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
                duration: data.duration||null,
                videoUrl: data.videoUrl
            }], { session });

            if (session) await session.commitTransaction();
            if (session) session.endSession();

            return { movie: movie[0], content: content[0] };
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

        return movies.filter(movie => movie.contentId !== null);
    }

    async getMovieById(id, isAdmin = false) {
        const matchCondition = isAdmin ? {} : { status: CONTENT_STATUS.PUBLISHED };

        const movie = await Movie.findById(id).populate({
            path: 'contentId',
            match: matchCondition
        });

        if (!movie || !movie.contentId) {
            throw new AppError('Movie not found or not available', 404);
        }

        return movie;
    }

    async updateMovie(id, data) {
        const movie = await Movie.findById(id);
        if (!movie) throw new AppError('Movie not found', 404);

        if (data.publishAt !== undefined) {
            const now = new Date();
            const publishDate = new Date(data.publishAt);


            data.status = (publishDate <= now) ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT;
        }
        const contentFields = ['title', 'description', 'poster', 'ageRating', 'trailerUrl', 'releaseYear', 'status', 'publishAt'];
        const contentData = {};
        const movieData = {};

        for (const key in data) {
            if (contentFields.includes(key)) contentData[key] = data[key];
            else movieData[key] = data[key];
        }

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();
        try {
            if (Object.keys(contentData).length > 0) {
                await Content.findByIdAndUpdate(movie.contentId, contentData, { new: true, runValidators: true, session });
            }
            if (Object.keys(movieData).length > 0) {
                await Movie.findByIdAndUpdate(id, movieData, { new: true, runValidators: true, session });
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

            await Movie.findByIdAndDelete(id, { session });
            await Content.findByIdAndDelete(movie.contentId, { session });

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
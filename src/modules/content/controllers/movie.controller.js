const movieService = require('../services/movie.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');

class MovieController {
    create = async(req, res) => {
        const {
            title,
            description,
            poster,
            ageRating,
            trailerUrl,
            releaseYear,
            status,
            publishAt,
            duration,
            videoUrl,
            genres,
            casts
        } = req.body;
        const data = {
            title,
            description,
            poster,
            ageRating,
            trailerUrl,
            releaseYear,
            status,
            publishAt,
            duration,
            videoUrl,
            genres,
            casts
        };

        const result = await movieService.createMovie(data);
        return successResponse(res, 201, 'Movie created successfully', result);
    };

    getAllForAdmin = async(req, res) => {
        const movies = await movieService.getMovies(true);
        return successResponse(res, 200, 'All movies fetched successfully', movies);
    };

    getByIdForAdmin = async(req, res) => {
        const { id } = req.params;
        const movie = await movieService.getMovieById(id, true);
        return successResponse(res, 200, 'Movies details fetched successfully', movie);
    };

    getAllForClient = async(req, res) => {
        const movies = await movieService.getMovies(false);
        return successResponse(res, 200, 'Available movies fetched successfully', movies);
    };

    getByIdForClient = async(req, res) => {
        const { id } = req.params;
        const movie = await movieService.getMovieById(id, false);
        return successResponse(res, 200, 'Movies details fetched successfully', movie);
    };

    update = async(req, res) => {
        const { id } = req.params;
        const {
            title,
            description,
            poster,
            ageRating,
            trailerUrl,
            releaseYear,
            status,
            publishAt,
            duration,
            videoUrl,
            genres,
            casts
        } = req.body;
        const data = {
            title,
            description,
            poster,
            ageRating,
            trailerUrl,
            releaseYear,
            status,
            publishAt,
            duration,
            videoUrl,
            genres,
            casts
        };

        const movie = await movieService.updateMovie(id, data);
        return successResponse(res, 200, 'Movie updated successfully', movie);
    };

    changeStatus = async(req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        const movie = await movieService.changeStatus(id, status);
        return successResponse(res, 200, 'Movie status updated successfully', movie);
    };

    delete = async(req, res) => {
        const { id } = req.params;
        await movieService.deleteMovie(id);
        return successResponse(res, 200, 'Movie deleted successfully', null);
    };
}

module.exports = new MovieController();
module.exports = new MovieController();
module.exports = new MovieController();
const movieService = require('../services/movie.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const asyncHandler = require('../../../utils/asyncHandler');

class MovieController {
    create = asyncHandler(async (req, res) => {
        const result = await movieService.createMovie(req.body);
        return successResponse(res, 201, 'Movie created successfully', result);
    });

    getAllForAdmin = asyncHandler(async (req, res) => {
        const movies = await movieService.getMovies(true); 
        return successResponse(res, 200, 'All movies fetched successfully', movies);
    });

    getByIdForAdmin = asyncHandler(async (req, res) => {
        const movie = await movieService.getMovieById(req.params.id, true);
        return successResponse(res, 200, 'Movies details fetched successfully', movie);
    });

    getAllForClient = asyncHandler(async (req, res) => {
        const movies = await movieService.getMovies(false); 
        return successResponse(res, 200, 'Available movies fetched successfully', movies);
    });

    getByIdForClient = asyncHandler(async (req, res) => {
        const movie = await movieService.getMovieById(req.params.id, false);
        return successResponse(res, 200, 'Movies details fetched successfully', movie);
    });

    update = asyncHandler(async (req, res) => {
        const movie = await movieService.updateMovie(req.params.id, req.body);
        return successResponse(res, 200, 'Movie updated successfully', movie);
    });

    changeStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const movie = await movieService.changeStatus(req.params.id, status);
        return successResponse(res, 200, 'Movie status updated successfully', movie);
    });

    delete = asyncHandler(async (req, res) => {
        await movieService.deleteMovie(req.params.id);
        return successResponse(res, 200, 'Movie deleted successfully', null);
    });
}

module.exports = new MovieController();
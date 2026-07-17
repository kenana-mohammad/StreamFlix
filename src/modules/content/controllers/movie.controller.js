// const movieService = require('../services/movie.service');
// const { successResponse } = require('../../../shared/helpers/api-response.helper');

// class MovieController {
//     create = async (req, res) => {
//         const { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, duration, videoUrl } = req.body;
//         const data = { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, duration, videoUrl };
        
//         const result = await movieService.createMovie(data);
//         return successResponse(res, 201, 'Movie created successfully', result);
//     };

//     getAllForAdmin = async (req, res) => {
//         const movies = await movieService.getMovies(true); 
//         return successResponse(res, 200, 'All movies fetched successfully', movies);
//     };

//     getByIdForAdmin = async (req, res) => {
//         const { id } = req.params;
//         const movie = await movieService.getMovieById(id, true);
//         return successResponse(res, 200, 'Movies details fetched successfully', movie);
//     };

//     getAllForClient = async (req, res) => {
//         const movies = await movieService.getMovies(false); 
//         return successResponse(res, 200, 'Available movies fetched successfully', movies);
//     };

//     getByIdForClient = async (req, res) => {
//         const { id } = req.params;
//         const movie = await movieService.getMovieById(id, false);
//         return successResponse(res, 200, 'Movies details fetched successfully', movie);
//     };

//     update = async (req, res) => {
//         const { id } = req.params;
//         const { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, duration, videoUrl } = req.body;
//         const data = { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, duration, videoUrl };
        
//         const movie = await movieService.updateMovie(id, data);
//         return successResponse(res, 200, 'Movie updated successfully', movie);
//     };

//     changeStatus = async (req, res) => {
//         const { id } = req.params;
//         const { status } = req.body;

//         const movie = await movieService.changeStatus(id, status);
//         return successResponse(res, 200, 'Movie status updated successfully', movie);
//     };

//     delete = async (req, res) => {
//         const { id } = req.params;
//         await movieService.deleteMovie(id);
//         return successResponse(res, 200, 'Movie deleted successfully', null);
//     };
// }

// module.exports = new MovieController();
const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');
const { createMovieValidator, movieIdValidator, updateMovieValidator } = require('../validations/movie.validation');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const {ROLES} = require('../../../shared/constants/roles.constant')

// Admin & Content Manager Routes
router.post('/admin',
     [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    createMovieValidator, validate, asyncHandler(movieController.create));
router.get('/admin',
     [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
      asyncHandler(movieController.getAllForAdmin));
router.get('/admin/:id', auth, 
    [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
 movieIdValidator, validate, asyncHandler(movieController.getByIdForAdmin));
router.put('/admin/:id',
    [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    movieIdValidator, updateMovieValidator, validate, asyncHandler(movieController.update));
router.patch('/admin/:id/status', 
    [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
     movieIdValidator, changeStatusValidator, validate, asyncHandler(movieController.changeStatus));
router.delete('/admin/:id',
    [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    movieIdValidator, validate, asyncHandler(movieController.delete));

// Client Routes
router.get('/client', asyncHandler(movieController.getAllForClient));
router.get('/client/:id', movieIdValidator, validate, asyncHandler(movieController.getByIdForClient));


module.exports = router;
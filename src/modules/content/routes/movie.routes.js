const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const validate = require('../../../middlewares/validate');
const role = require('../../../middlewares/role');
const { createMovieValidator, movieIdValidator, updateMovieValidator } = require('../validations/movie.validation');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const { ROLES } = require('../../../shared/constants/roles.constant');
const auth = require('../../../middlewares/Auth');

// Admin & Content Manager Routes
router.post('/admin',
    createMovieValidator, validate, asyncHandler(movieController.create));
router.get('/admin', [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    asyncHandler(movieController.getAllForAdmin));
router.get('/admin/:id', auth, [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    movieIdValidator, validate, asyncHandler(movieController.getByIdForAdmin));
router.put('/admin/:id',
    movieIdValidator, updateMovieValidator, validate, asyncHandler(movieController.update));
router.patch('/admin/:id/status', [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    movieIdValidator, changeStatusValidator, validate, asyncHandler(movieController.changeStatus));
router.delete('/admin/:id', [auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])],
    movieIdValidator, validate, asyncHandler(movieController.delete));

// Client Routes
router.get('/client', asyncHandler(movieController.getAllForClient));
router.get('/client/:id', movieIdValidator, validate, asyncHandler(movieController.getByIdForClient));


module.exports = router;
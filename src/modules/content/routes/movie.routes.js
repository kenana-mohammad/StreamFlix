const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createMovieValidator, movieIdValidator, updateMovieValidator } = require('../validations/movie.validation');
const { changeStatusValidator } = require('../validations/content.validation'); 
const asyncHandler = require('../../../utils/asyncHandler');

// Admin & Content Manager Routes
router.post('/admin', auth, role(['admin', 'content_manager']), createMovieValidator, validate, asyncHandler(movieController.create));
router.get('/admin', auth, role(['admin', 'content_manager']), asyncHandler(movieController.getAllForAdmin));
router.get('/admin/:id', auth, role(['admin', 'content_manager']), movieIdValidator, validate, asyncHandler(movieController.getByIdForAdmin));
router.put('/admin/:id', auth, role(['admin', 'content_manager']), movieIdValidator, updateMovieValidator, validate, asyncHandler(movieController.update));
router.patch('/admin/:id/status', auth, role(['admin', 'content_manager']), movieIdValidator, changeStatusValidator, validate, asyncHandler(movieController.changeStatus));
router.delete('/admin/:id', auth, role(['admin', 'content_manager']), movieIdValidator, validate, asyncHandler(movieController.delete));

// Client Routes
router.get('/client', asyncHandler(movieController.getAllForClient));
router.get('/client/:id', movieIdValidator, validate, asyncHandler(movieController.getByIdForClient));

module.exports = router;
const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createSeriesValidator, seriesIdValidator, updateSeriesValidator } = require('../validations/series.validation');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');

// Admin & Content Manager Routes
router.post('/admin',
    // auth, role(['admin', 'content_manager']),
    createSeriesValidator, validate, asyncHandler(seriesController.create));
router.get('/admin', auth, role(['admin', 'content_manager']), asyncHandler(seriesController.getAllForAdmin));
router.get('/admin/:id', auth, role(['admin', 'content_manager']), seriesIdValidator, validate, asyncHandler(seriesController.getByIdForAdmin));
router.put('/admin/:id',
    // auth, role(['admin', 'content_manager']),
    seriesIdValidator, updateSeriesValidator, validate, asyncHandler(seriesController.update));
router.patch('/admin/:id/status', auth, role(['admin', 'content_manager']), seriesIdValidator, changeStatusValidator, validate, asyncHandler(seriesController.changeStatus));
router.delete('/admin/:id', auth, role(['admin', 'content_manager']), seriesIdValidator, validate, asyncHandler(seriesController.delete));

// Client Routes
router.get('/client', asyncHandler(seriesController.getAllForClient));
router.get('/client/:id', seriesIdValidator, validate, asyncHandler(seriesController.getByIdForClient));

module.exports = router;
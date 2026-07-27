const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/season.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createSeasonValidator, seasonIdValidator, updateSeasonValidator } = require('../validations/season.validation');
const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');

// Admin & Content Manager Routes
router.post('/admin/:seriesId',
    createSeasonValidator, validate, asyncHandler(seasonController.create));
router.put('/admin/:id', auth, role(['admin', 'content_manager']), seasonIdValidator, updateSeasonValidator, validate, asyncHandler(seasonController.update));
router.patch('/admin/:id/status', auth, role(['admin', 'content_manager']), seasonIdValidator, changeStatusValidator, validate, asyncHandler(seasonController.changeStatus));
router.delete('/admin/:id', auth, role(['admin', 'content_manager']), seasonIdValidator, validate, asyncHandler(seasonController.delete));

// Public/Client Routes
router.get('/series/:seriesId',
    param('seriesId').isMongoId().withMessage('Series ID is invalid'),
    validate,
    asyncHandler(seasonController.getBySeries)
);

module.exports = router;
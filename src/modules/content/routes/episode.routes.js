const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episode.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createEpisodeValidator, episodeIdValidator, updateEpisodeValidator } = require('../validations/episode.validation');
const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');

// Admin & Content Manager Routes
router.post('/admin', auth, role(['admin', 'content_manager']), createEpisodeValidator, validate, asyncHandler(episodeController.create));
router.put('/admin/:id', auth, role(['admin', 'content_manager']), episodeIdValidator, updateEpisodeValidator, validate, asyncHandler(episodeController.update));
router.patch('/admin/:id/status', auth, role(['admin', 'content_manager']), episodeIdValidator, changeStatusValidator, validate, asyncHandler(episodeController.changeStatus));
router.delete('/admin/:id', auth, role(['admin', 'content_manager']), episodeIdValidator, validate, asyncHandler(episodeController.delete));

// Public/Client Routes
router.get('/:id', episodeIdValidator, asyncHandler(episodeController.getById));
router.get('/season/:seasonId', 
    param('seasonId').isMongoId().withMessage('Season ID is invalid'), 
    validate, 
    asyncHandler(episodeController.getBySeason)
);

module.exports = router;
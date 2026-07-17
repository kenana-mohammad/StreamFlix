const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episode.controller');
const validate = require('../../../middlewares/validate');
const { createEpisodeValidator, episodeIdValidator, updateEpisodeValidator } = require('../validations/episode.validation');
const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');
const { ROLES } = require('../../../shared/constants/roles.constant');

// Admin & Content Manager Routes
router.post('/admin/season/:seasonId',
   role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
    createEpisodeValidator, validate, asyncHandler(episodeController.create));
router.put('/admin/:id', auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]), episodeIdValidator, updateEpisodeValidator, validate, asyncHandler(episodeController.update));
router.patch('/admin/:id/status', auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]), episodeIdValidator, changeStatusValidator, validate, asyncHandler(episodeController.changeStatus));
router.delete('/admin/:id', auth, role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]), episodeIdValidator, validate, asyncHandler(episodeController.delete));

// Public/Client Routes
router.get('/:id', episodeIdValidator, asyncHandler(episodeController.getById));
router.get('/season/:seasonId',
    param('seasonId').isMongoId().withMessage('Season ID is invalid'),
    validate,
    asyncHandler(episodeController.getBySeason)
);

module.exports = router;
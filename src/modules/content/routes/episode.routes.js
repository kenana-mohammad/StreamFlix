const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episode.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createEpisodeValidator, episodeIdValidator, updateEpisodeValidator } = require('../validations/episode.validation');
const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');

router.post('/admin', auth, role(['admin']), createEpisodeValidator, validate, episodeController.create);
router.get('/:id', episodeIdValidator, episodeController.getById);
router.get('/season/:seasonId', 
    param('seasonId').isMongoId().withMessage('Season ID is invalid'), 
    validate, 
    episodeController.getBySeason
);
router.put('/admin/:id', auth, role(['admin']), episodeIdValidator, updateEpisodeValidator, validate, episodeController.update);
router.delete('/admin/:id', auth, role(['admin']), episodeIdValidator, validate, episodeController.delete);
router.patch('/admin/:id/status', auth, role(['admin']), episodeIdValidator, changeStatusValidator, validate, episodeController.changeStatus);
module.exports = router;
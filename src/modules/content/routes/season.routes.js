const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/season.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createSeasonValidator, seasonIdValidator, updateSeasonValidator } = require('../validations/season.validation');
const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');

router.post('/admin', auth, role(['admin']), createSeasonValidator, validate, seasonController.create);

router.get('/series/:seriesId', 
    param('seriesId').isMongoId().withMessage('Series ID is  invalid'), 
    validate, 
    seasonController.getBySeries
);
router.put('/admin/:id', auth, role(['admin']), seasonIdValidator, updateSeasonValidator, validate, seasonController.update);
router.delete('/admin/:id', auth, role(['admin']), seasonIdValidator, validate, seasonController.delete);
router.patch('/admin/:id/status', auth, role(['admin']), seasonIdValidator, changeStatusValidator, validate, seasonController.changeStatus);

module.exports = router;
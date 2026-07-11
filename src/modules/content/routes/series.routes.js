const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createSeriesValidator, seriesIdValidator, updateSeriesValidator } = require('../validations/series.validation');
const { changeStatusValidator } = require('../validations/content.validation'); 

router.post('/admin', auth, role(['admin']), createSeriesValidator, validate, seriesController.create);
router.get('/admin', auth, role(['admin']), seriesController.getAllForAdmin);
router.get('/admin/:id', auth, role(['admin']), seriesIdValidator, validate, seriesController.getByIdForAdmin);

router.get('/client', seriesController.getAllForClient);
router.get('/client/:id', seriesIdValidator, validate, seriesController.getByIdForClient);

router.put('/admin/:id', auth, role(['admin']), seriesIdValidator, updateSeriesValidator, validate, seriesController.update);
router.patch('/admin/:id/status', auth, role(['admin']), seriesIdValidator, changeStatusValidator, validate, seriesController.changeStatus);
router.delete('/admin/:id', auth, role(['admin']), seriesIdValidator, validate, seriesController.delete);
module.exports = router;
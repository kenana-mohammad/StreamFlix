const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { createMovieValidator, movieIdValidator, updateMovieValidator } = require('../validations/movie.validation');
const { changeStatusValidator } = require('../validations/content.validation'); 

router.post('/admin', auth, role(['admin']), createMovieValidator, validate, movieController.create);

router.get('/admin', auth, role(['admin']), movieController.getAllForAdmin);

router.get('/admin/:id', auth, role(['admin']), movieIdValidator, validate, movieController.getByIdForAdmin);

router.get('/client', movieController.getAllForClient);
router.get('/client/:id', movieIdValidator, validate, movieController.getByIdForClient);

router.put('/admin/:id', auth, role(['admin']), movieIdValidator, updateMovieValidator, validate, movieController.update);
router.patch('/admin/:id/status', auth, role(['admin']), movieIdValidator, changeStatusValidator, validate, movieController.changeStatus);
router.delete('/admin/:id', auth, role(['admin']), movieIdValidator, validate, movieController.delete);

module.exports = router;
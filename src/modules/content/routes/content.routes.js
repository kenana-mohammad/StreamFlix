const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { contentIdValidator } = require('../validations/content.validation');

router.get('/admin', auth, role(['admin']), contentController.getAllForAdmin);
router.get('/admin/:id', auth, role(['admin']), contentIdValidator, validate, contentController.getByIdForAdmin);

router.get('/client', contentController.getAllForClient);
router.get('/client/:id', contentIdValidator, validate, contentController.getByIdForClient);

module.exports = router;
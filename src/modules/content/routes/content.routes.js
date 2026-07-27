const express = require('express');
const router = express.Router();

const contentController = require('../controllers/content.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { contentIdValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');


// Admin & Content Manager Routes
router.get(
    '/admin',
    auth,
    role(['admin', 'content_manager']),
    asyncHandler(contentController.getAllForAdmin)
);

router.get(
    '/admin/:id',
    auth,
    role(['admin', 'content_manager']),
    contentIdValidator,
    validate,
    asyncHandler(contentController.getByIdForAdmin)
);


// Top Rated Content
router.get(
    '/top-rated',
    asyncHandler(contentController.getTopRated)
);


// Client Routes
router.get(
    '/client',
    asyncHandler(contentController.getAllForClient)
);

router.get(
    '/client/:id',
    contentIdValidator,
    validate,
    asyncHandler(contentController.getByIdForClient)
);


module.exports = router;
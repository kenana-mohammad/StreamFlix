const express = require('express');
const router = express.Router();

const contentController = require('../controllers/content.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/Auth');
const role = require('../../../middlewares/Role');
const { ROLES } = require('../../../shared/constants/roles.constant');
const { contentIdValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');

const STAFF_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_MANAGER
];

// Admin & Content Manager Routes

router.get(
    '/admin',
    auth,
    role(STAFF_ROLES),
    asyncHandler(contentController.getAllForAdmin)
);

router.get(
    '/admin/:id',
    auth,
    role(STAFF_ROLES),
    contentIdValidator,
    validate,
    asyncHandler(contentController.getByIdForAdmin)
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
// Top Rated Content
router.get(
    '/top-rated',
    asyncHandler(contentController.getTopRated)
);
module.exports = router;
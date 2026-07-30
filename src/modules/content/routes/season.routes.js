const express = require('express');
const router = express.Router();

const seasonController = require('../controllers/season.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');

const {
    createSeasonValidator,
    seasonIdValidator,
    updateSeasonValidator
} = require('../validations/season.validation');

const { param } = require('express-validator');
const { changeStatusValidator } = require('../validations/content.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const { ROLES } = require('../../../shared/constants/roles.constant');

const STAFF_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_MANAGER
];

// Admin & Content Manager Routes

router.post(
    '/admin/:seriesId',
    auth,
    role(STAFF_ROLES),
    createSeasonValidator,
    validate,
    asyncHandler(seasonController.create)
);

router.put(
    '/admin/:id',
    auth,
    role(STAFF_ROLES),
    seasonIdValidator,
    updateSeasonValidator,
    validate,
    asyncHandler(seasonController.update)
);

router.patch(
    '/admin/:id/status',
    auth,
    role(STAFF_ROLES),
    seasonIdValidator,
    changeStatusValidator,
    validate,
    asyncHandler(seasonController.changeStatus)
);

router.delete(
    '/admin/:id',
    auth,
    role(STAFF_ROLES),
    seasonIdValidator,
    validate,
    asyncHandler(seasonController.delete)
);

// Public/Client Routes

router.get(
    '/series/:seriesId',
    param('seriesId')
        .isMongoId()
        .withMessage('Series ID is invalid'),
    validate,
    asyncHandler(seasonController.getBySeries)
);

module.exports = router;
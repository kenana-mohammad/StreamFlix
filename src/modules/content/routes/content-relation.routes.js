const express = require('express');
const router = express.Router();

const relationController = require('../controllers/content-relation.controller');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');
const { ROLES } = require('../../../shared/constants/roles.constant');
const asyncHandler = require('../../../utils/asyncHandler');

const {
    addGenresValidator,
    removeGenreValidator,
    addCastValidator,
    updateCastValidator,
    removeCastValidator,
    contentIdRelationValidator,
    genreIdRelationValidator,
    castIdRelationValidator
} = require('../validations/content-relation.validation');

const STAFF_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.CONTENT_MANAGER
];

// Admin APIs (Genres & Cast)

router.post(
    '/admin/content/:id/genres',
    auth,
    role(STAFF_ROLES),
    addGenresValidator,
    validate,
    asyncHandler(relationController.addGenres)
);

router.delete(
    '/admin/content/:id/genres/:genreId',
    auth,
    role(STAFF_ROLES),
    removeGenreValidator,
    validate,
    asyncHandler(relationController.removeGenre)
);

router.post(
    '/admin/content/:id/cast',
    auth,
    role(STAFF_ROLES),
    addCastValidator,
    validate,
    asyncHandler(relationController.addCast)
);

router.put(
    '/admin/content/:id/cast/:castId',
    auth,
    role(STAFF_ROLES),
    updateCastValidator,
    validate,
    asyncHandler(relationController.updateCast)
);

router.delete(
    '/admin/content/:id/cast/:castId',
    auth,
    role(STAFF_ROLES),
    removeCastValidator,
    validate,
    asyncHandler(relationController.removeCast)
);

// Client APIs (Fetch Relations)

router.get(
    '/contents/:id/genres',
    contentIdRelationValidator,
    validate,
    asyncHandler(relationController.getContentGenres)
);

router.get(
    '/contents/:id/cast',
    contentIdRelationValidator,
    validate,
    asyncHandler(relationController.getContentCast)
);

router.get(
    '/genres/:genreId/contents',
    genreIdRelationValidator,
    validate,
    asyncHandler(relationController.getContentByGenre)
);

router.get(
    '/cast/:castId/contents',
    castIdRelationValidator,
    validate,
    asyncHandler(relationController.getContentByCast)
);

module.exports = router;
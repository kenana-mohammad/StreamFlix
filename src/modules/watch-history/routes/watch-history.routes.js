const express = require('express');
const watchHistoryController = require('../controllers/watch-history.controller');
const {
    recordViewingValidation,
    profileHistoryValidation,
    deleteHistoryItemValidation
} = require('../validations/watch-history.validation');
const asyncHandler = require('../../../utils/asyncHandler');
const auth = require('../../../middlewares/auth');
const validateProfileOwnership = require('../../../middlewares/validateProfileOwnership');

const router = express.Router();

router.post(
    '/:profileId/history',
    [auth, ...recordViewingValidation, validateProfileOwnership],
    asyncHandler(watchHistoryController.recordViewing)
);

router.get(
    '/:profileId/history',
    [auth, ...profileHistoryValidation, validateProfileOwnership],
    asyncHandler(watchHistoryController.getHistory)
);

router.delete(
    '/:profileId/history/:contentId',
    [auth, ...deleteHistoryItemValidation, validateProfileOwnership],
    asyncHandler(watchHistoryController.deleteHistoryItem)
);

router.delete(
    '/:profileId/history',
    [auth, ...profileHistoryValidation, validateProfileOwnership],
    asyncHandler(watchHistoryController.deleteAllHistory)
);

module.exports = router;

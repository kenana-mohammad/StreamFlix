// routes/watchHistory.routes.js
const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../utils/asyncHandler');
const validateActiveProfile = require('../../../middlewares/validateActiveProfile');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');
const { ROLES } = require('../../../shared/constants/roles.constant');
const WatchHistoryController = require('../controllers/watchHistory.controller');
const {
    saveHistoryValidation,
    getHistoryValidation,
    removeHistoryItemValidation,
    clearHistoryValidation
} = require('../validations/watch-history.validation');

router.get('/admin/history/analytics', [auth, role([ROLES.SUPER_ADMIN])],
    asyncHandler(WatchHistoryController.getAnalytics)
);

router.post('/history', [auth, ...saveHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.saveOrUpdateProgress)
);

router.get('/history', [auth, ...getHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.getHistory)
);

router.delete('/history/:contentId', [auth, ...removeHistoryItemValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.removeItem)
);

router.delete('/history', [auth, ...clearHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.clearAll)
);

router.post(
    '/profiles/:profileId/history',
    [auth, ...saveHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.saveOrUpdateProgress)
);

router.get(
    '/profiles/:profileId/history',
    [auth, ...getHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.getHistory)
);

router.delete(
    '/profiles/:profileId/history/:contentId',
    [auth, ...removeHistoryItemValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.removeItem)
);

router.delete(
    '/profiles/:profileId/history',
    [auth, ...clearHistoryValidation, validateActiveProfile],
    asyncHandler(WatchHistoryController.clearAll)
);

module.exports = router;

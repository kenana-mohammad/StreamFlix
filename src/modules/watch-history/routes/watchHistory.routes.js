// routes/watchHistory.routes.js
const express = require('express');
const router = express.Router();

const asyncHandler = require('../../../utils/asyncHandler');
const validateActiveProfile = require('../../../middlewares/validateActiveProfile');
const auth = require('../../../middlewares/auth');

router.get('/admin/history/analytics', [auth, role([ROLES.SUPER_ADMIN])],
    asyncHandler(WatchHistoryController.getAnalytics)
);

router.post('/history', [auth, validateActiveProfile],
    asyncHandler(WatchHistoryController.saveOrUpdateProgress)
);

router.get('/history', [auth, validateActiveProfile],
    asyncHandler(WatchHistoryController.getHistory)
);

router.delete('/history/:contentId', [auth, validateActiveProfile],
    asyncHandler(WatchHistoryController.removeItem)
);

router.delete('/history', [auth, validateActiveProfile],
    asyncHandler(WatchHistoryController.clearAll)
);

module.exports = router;
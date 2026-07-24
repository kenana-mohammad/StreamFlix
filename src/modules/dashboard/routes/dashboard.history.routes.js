const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../../../utils/asyncHandler');
const auth = require('../../../middlewares/auth');
const role = require('../../../middlewares/role');
const { ROLES } = require('../../../shared/constants/roles.constant');

const router = express.Router();

router.get(
    '/analytics',
    auth,
    role([ROLES.SUPER_ADMIN], { standardResponse: true }),
    asyncHandler(dashboardController.getHistoryAnalytics)
);

module.exports = router;

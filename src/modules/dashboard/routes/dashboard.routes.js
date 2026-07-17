const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboard.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const role = require("../../../middlewares/role");
const auth = require("../../../middlewares/auth");
const { ROLES } = require("../../../shared/constants/roles.constant");

router.get("/",
    [auth, role(ROLES.SUPER_ADMIN)], 
    asyncHandler(DashboardController.getDashboardData));

module.exports = router;
const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboard.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const role = require("../../../middlewares/role");
const auth = require("../../../middlewares/auth");
const { SUPER_ADMIN } = require("../../../shared/constants/roles.constant");

router.get("/",
    // [auth, role(SUPER_ADMIN)], 
    asyncHandler(DashboardController.getDashboardData));

module.exports = router;
const express = require("express");
const router = express.Router();
const DashboardUsersController = require("../controllers/dashboard.users.controller");
const role = require("../../../middlewares/role");
const asyncHandler = require("../../../utils/asyncHandler");
const { userIdValidation } = require("../validations/dashboard.users.validation");
const auth = require("../../../middlewares/auth");
const { SUPER_ADMIN } = require("../../../shared/constants/roles.constant");

router.get("/search",
     [auth, role(SUPER_ADMIN)], 
    asyncHandler(DashboardUsersController.searchUser));

router.get("/:id",
     [auth, userIdValidation, role(SUPER_ADMIN)],
    asyncHandler(DashboardUsersController.getUserInfo));

router.put("/enable/:id",
     [auth, userIdValidation, role(SUPER_ADMIN)],
     asyncHandler(DashboardUsersController.enableAccount));

router.put("/disable/:id",
     [auth, userIdValidation, role(SUPER_ADMIN)],
     asyncHandler(DashboardUsersController.disableAccount));

module.exports = router;
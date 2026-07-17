const express = require("express");
const router = express.Router();
const DashboardUsersController = require("../controllers/dashboard.users.controller");
const role = require("../../../middlewares/role");
const asyncHandler = require("../../../utils/asyncHandler");
const { userIdValidation } = require("../validations/dashboard.users.validation");
const auth = require("../../../middlewares/auth");
const { ROLES } = require("../../../shared/constants/roles.constant");

router.get("/",
    [auth, role(ROLES.SUPER_ADMIN)], 
    asyncHandler(DashboardUsersController.getUsers));
router.post("/create/content-manager", [auth, role(ROLES.SUPER_ADMIN)],
    asyncHandler(DashboardUsersController.createContentManager));

router.get("/:id", [userIdValidation,
          auth, role(ROLES.SUPER_ADMIN)
    ],
    asyncHandler(DashboardUsersController.getUserInfo));

router.put("/update-status/:id", [userIdValidation,auth,
           role(ROLES.SUPER_ADMIN),
    ],
    asyncHandler(DashboardUsersController.updateAccountStatus));



module.exports = router;
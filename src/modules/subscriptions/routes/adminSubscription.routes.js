const express = require("express");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/Auth");
const checkPlanActive = require("../../plans/middlewares/checkPlanActive");
const id = require("../../../middlewares/id");
const role = require("../../../middlewares/Role");
const { ROLES } = require("../../../shared/constants/roles.constant");
const adminSubscriptionController = require("../controllers/adminSubscription.controller");
const router = express.Router();
//get all subscription
router.get("/", [auth, role(ROLES.SUPER_ADMIN)], asyncHandler(adminSubscriptionController.getSubscriptions));
//================
//get subscription details 
router.get("/:id", [auth, role(ROLES.SUPER_ADMIN), id], asyncHandler(adminSubscriptionController.getSubscriptionDetails));

module.exports = router;
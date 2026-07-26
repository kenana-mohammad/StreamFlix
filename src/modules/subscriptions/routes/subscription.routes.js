const express = require("express");
const subscriptionController = require("../controllers/subscription.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");
const checkPlanActive = require("../../plans/middlewares/checkPlanActive");
const id = require("../../../middlewares/id");
const { createSubscriptionValidation, renewManualValidation } = require("../validations/subscription.validation");
const { checkActiveSubscription } = require("../../../middlewares/checkActiveSubscription");
const router = express.Router();
//get account subscription usage
router.get("/usage", [auth, checkActiveSubscription], asyncHandler(subscriptionController.getUsage));//get my subscription
router.get("/my-subscriptions", [auth], asyncHandler(subscriptionController.getMySubscriptions));
//================
//get subscription details 
router.get("/my-subscriptions/:id", [auth, id], asyncHandler(subscriptionController.getMySubscriptionDetails));

//==================
//التجديد اليدوي
router.put("/renewManual/:subscriptionId", [auth, ...renewManualValidation], asyncHandler(subscriptionController.renewManual));
//canclled
router.put("/cancel-subscription/:id", [auth], asyncHandler(subscriptionController.cancelSubscription));
//upgrade

router.post("/upgrade-subscription/:planId", [auth, checkPlanActive, checkActiveSubscription], asyncHandler(subscriptionController.upgradeSubscription));

//الاشتراك
router.post("/:planId", [auth, checkPlanActive, ...createSubscriptionValidation], asyncHandler(subscriptionController.createSubscription));
module.exports = router;

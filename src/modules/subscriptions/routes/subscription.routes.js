const express = require("express");
const subscriptionController = require("../controllers/subscription.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/Auth");
const checkPlanActive = require("../../plans/middlewares/checkPlanActive");
const id = require("../../../middlewares/id");
const router = express.Router();
//get my subscription
router.get("/my-subscriptions", [auth], asyncHandler(subscriptionController.getMySubscriptions));
//================
//get subscription details 
router.get("/my-subscriptions/:id", [auth, id], asyncHandler(subscriptionController.getMySubscriptionDetails));

//==================
//التجديد اليدوي
router.put("/renewManual/:subscriptionId", [auth], asyncHandler(subscriptionController.renewManual));
//canclled
router.put("/cancel-subscription/:id", [auth], asyncHandler(subscriptionController.cancelSubscription));

//الاشتراك
router.post("/:planId", [auth, checkPlanActive], asyncHandler(subscriptionController.createSubscription));
module.exports = router;
const express = require("express");
const subscriptionController = require("../controllers/subscription.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/Auth");
const validatePrimaryProfile = require("../../../middlewares/validatePrimaryProfile");
const checkPlanActive = require("../../plans/middlewares/checkPlanActive");
const id = require("../../../middlewares/id");
const { createSubscriptionValidation, renewManualValidation } = require("../validations/subscription.validation");
const { checkActiveSubscription } = require("../../../middlewares/checkActiveSubscription");

const router = express.Router();

// 1. عرض اشتراكاتي
router.get("/my-subscriptions", [auth, validatePrimaryProfile], asyncHandler(subscriptionController.getMySubscriptions));

// 2. عرض تفاصيل اشتراك محدد (الـ id بعد المصادقة والبروفايل الرئيسي)
router.get("/my-subscriptions/:id", [auth, validatePrimaryProfile, id], asyncHandler(subscriptionController.getMySubscriptionDetails));

// 3. التجديد اليدوي
router.put("/renewManual/:subscriptionId", [auth, validatePrimaryProfile, ...renewManualValidation], asyncHandler(subscriptionController.renewManual));

// 4. إلغاء الاشتراك
router.put("/cancel-subscription/:id", [auth, validatePrimaryProfile, id], asyncHandler(subscriptionController.cancelSubscription));

// 5. ترقية الاشتراك
router.post("/upgrade-subscription/:planId", [auth, validatePrimaryProfile, checkPlanActive, checkActiveSubscription], asyncHandler(subscriptionController.upgradeSubscription));

// 6. الاشتراك الجديد (إنشاء اشتراك)
router.post("/:planId", [auth, validatePrimaryProfile, checkPlanActive, ...createSubscriptionValidation], asyncHandler(subscriptionController.createSubscription));

module.exports = router;
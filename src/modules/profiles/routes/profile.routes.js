const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profile.controllers");
const asyncHandler = require("./../../../utils/asyncHandler");
const validatePrimaryProfile = require("../../../middlewares/validatePrimaryProfile");
const validateProfileOwnership = require("../../../middlewares/validateProfileOwnership");
const { checkActiveSubscription } = require("../../../middlewares/checkActiveSubscription");
const { checkMaxProfiles } = require("../../../middlewares/checkMaxProfiles");
const {
    createProfileValidation,
    updateProfileValidation,
    pinValidation,
    changePinValidation
} = require("../validations/profile.validation");
const checkPinForCreation = require("../../../middlewares/checkPinForCreation");
const auth = require("../../../middlewares/Auth");
const validateProfileToken = require("./../../../middlewares/validateProfileToken")
    // ==========================================
    // ==========================================

router.put('/me/update', [
    auth,validateProfileToken,
    updateProfileValidation
], asyncHandler(ProfileController.updateMe));
// تغيير الـ PIN للبروفايل الحالي باستخدام توكن البروفايل وبشرط إدخال القديم والجديد
router.put('/me/change-pin', [
    auth,validateProfileToken,
    changePinValidation
], asyncHandler(ProfileController.changeMyPIN));

// ==========================================
// ==========================================

router.get('/', [auth], asyncHandler(ProfileController.getAll));

router.post('/', [
    auth,
    validatePrimaryProfile,
    checkActiveSubscription,
    checkPinForCreation,
    checkMaxProfiles,
    createProfileValidation
], asyncHandler(ProfileController.createProfile));

// ==========================================
// ==========================================
router.put('/update-profile/:id', [auth, validatePrimaryProfile, ...updateProfileValidation], asyncHandler(ProfileController.updateProfile));

router.post('/select/:id', [auth], asyncHandler(ProfileController.selectProfile));

router.post('/verify-pin/:id', [auth, pinValidation], asyncHandler(ProfileController.verifyPIN));

router.put('/add-pin/:id', [auth, validatePrimaryProfile, pinValidation], asyncHandler(ProfileController.addPIN));

router.put('/change-pin/:id', [auth, validatePrimaryProfile, changePinValidation], asyncHandler(ProfileController.changePIN));
router.put('/toggle-status/:id', [auth, validatePrimaryProfile], asyncHandler(ProfileController.toggleStatus));

router.delete('/:id', [auth, validatePrimaryProfile], asyncHandler(ProfileController.deleteProfile));

module.exports = router;
module.exports = router;
const express = require("express")
const router = express.Router();
const ProfileController = require("../controllers/profile.controllers");
const asyncHandler = require("./../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");
const validateProfileOwnership = require("../../../middlewares/validateProfileOwnership")
const {
    createProfileValidation,
    updateProfileValidation,
    pinValidation,
    changePinValidation
} = require("../validations/profile.validation");
const { checkActiveSubscription } = require("../../../middlewares/checkActiveSubscription");



router.get('/', [auth],
    asyncHandler(ProfileController.getAll)
)

router.post('/', [auth, checkActiveSubscription, createProfileValidation],
    asyncHandler(ProfileController.createProfile)
)

router.put('/:id', [auth, updateProfileValidation, validateProfileOwnership],
    asyncHandler(ProfileController.updateProfile)
)

router.post('/select/:id', [auth, checkActiveSubscription, validateProfileOwnership],
    asyncHandler(ProfileController.selectProfile)
)

router.post('/verify-pin/:id', [auth, pinValidation, validateProfileOwnership],
    asyncHandler(ProfileController.verifyPIN)
)

router.put('/add-pin/:id', [auth, pinValidation, validateProfileOwnership],
    asyncHandler(ProfileController.addPIN)
)

router.put('/change-pin/:id', [auth, changePinValidation, validateProfileOwnership],
    asyncHandler(ProfileController.changePIN)
)

router.delete('/:id', [auth, validateProfileOwnership],
    asyncHandler(ProfileController.deleteProfile)
)

module.exports = router;
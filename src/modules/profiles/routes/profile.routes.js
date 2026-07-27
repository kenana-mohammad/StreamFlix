const express = require("express")
const router = express.Router();
const ProfileController = require("../controllers/profile.controllers");
const asyncHandler = require("./../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");
const validateProfileOwnership = require("../../../middlewares/validateProfileOwnership")
const {checkActiveSubscription} = require("../../../middlewares/checkActiveSubscription")
const {checkMaxProfiles} = require("../../../middlewares/checkMaxProfiles")
const {createProfileValidation ,
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

router.post('/' , 
    [auth ,checkActiveSubscription,checkMaxProfiles, createProfileValidation],
    asyncHandler(ProfileController.createProfile)
)

router.put('/:id',
    [auth ,validateProfileOwnership, updateProfileValidation],



    asyncHandler(ProfileController.updateProfile)
)

router.post('/select/:id', [auth, checkActiveSubscription, validateProfileOwnership],
    asyncHandler(ProfileController.selectProfile)
)

router.post('/verify-pin/:id',
    [auth, validateProfileOwnership, pinValidation],
    asyncHandler(ProfileController.verifyPIN)
)

router.put('/add-pin/:id',
    [auth,validateProfileOwnership, pinValidation ],
    asyncHandler(ProfileController.addPIN)
)

router.put('/change-pin/:id' , 
    [auth, validateProfileOwnership , changePinValidation],
    asyncHandler(ProfileController.changePIN)
)
router.put('/toggle-status/:id',
    [auth , validateProfileOwnership],
    asyncHandler(ProfileController.toggleStatus)
)
router.delete('/:id', 
    [auth , validateProfileOwnership],

    asyncHandler(ProfileController.deleteProfile)
)

module.exports = router;
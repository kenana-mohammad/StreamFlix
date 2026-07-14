const express = require('express');
const userController = require('../controllers/user.controller');
const auth = require('../../../middlewares/auth');
const asyncHandler = require('../../../utils/asyncHandler');
const {
    updateProfileValidate
} = require('../validations/updateProfileValidate');

const router = express.Router();
//profile
router.get('/get-my-profile', [auth], asyncHandler(userController.getMyProfile));
router.put('/update-my-profile', [auth, ...updateProfileValidate], asyncHandler(userController.updateMyProfile));

module.exports = router;
const express = require("express");
const auth = require("../../../middlewares/auth");
const deviceController = require("../controllers/device.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const validatePrimaryProfile = require("../../../middlewares/validatePrimaryProfile");
const validateActiveProfile = require("../../../middlewares/validateActiveProfile");
const router = express.Router();
router.get('/get-my-devices', [auth, validateActiveProfile,
    validatePrimaryProfile,
], asyncHandler(deviceController.getMyDevice));
router.delete('/delete-device/:id', [auth], asyncHandler(deviceController.deleteDevice));


module.exports = router;
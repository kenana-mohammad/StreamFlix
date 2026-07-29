const express = require("express");
const deviceController = require("../controllers/device.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const validatePrimaryProfile = require("../../../middlewares/validatePrimaryProfile");
const auth = require("../../../middlewares/Auth");
const router = express.Router();
router.get('/get-my-devices', [auth, validatePrimaryProfile], asyncHandler(deviceController.getMyDevice));
router.delete('/delete-device/:id', [auth, validatePrimaryProfile], asyncHandler(deviceController.deleteDevice));


module.exports = router;
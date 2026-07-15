const express = require("express");
const auth = require("../../../middlewares/auth");
const deviceController = require("../controllers/device.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const router = express.Router();
router.get('/get-my-devices', [auth], asyncHandler(deviceController.getMyDevice));
router.delete('/delete-device/:id', [auth], asyncHandler(deviceController.deleteDevice));


module.exports = router;
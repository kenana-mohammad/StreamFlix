const express = require("express");

const homeController = require("../controllers/home.controller");
const asyncHandler = require("../../../utils/asyncHandler");



const router = express.Router();

router.get("/:id", asyncHandler(homeController.getHome));




module.exports = router;
const express = require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/asyncHandler");
const CastController = require("../controllers/cast.controller");

const {
    createCastValidation,
    updateCastValidation,
} = require("../validations/cast.validation");

// Admin APIs
router.post(
    "/",

    asyncHandler(CastController.createCast)
);

router.get(
    "/",
    asyncHandler(CastController.getAllCasts)
);

router.get(
    "/search",
    asyncHandler(CastController.searchCast)
);

router.get(
    "/:id",
    asyncHandler(CastController.getCastById)
);

router.put(
    "/:id",

    asyncHandler(CastController.updateCast)
);

router.delete(
    "/:id",
    asyncHandler(CastController.deleteCast)
);

module.exports = router;

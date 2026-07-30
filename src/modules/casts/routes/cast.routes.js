const express = require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/asyncHandler");
const CastController = require("../controllers/cast.controller");

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");

// add import
const validate = require("../../../middlewares/validate");

const { ROLES } = require("../../../shared/constants/roles.constant");

// Import Validators
const {
    createCastValidator,
    updateCastValidator,
    castIdValidator
} = require("../validations/cast.validation");

// Admin APIs
router.post(
    "/", [auth, role(ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER)],createCastValidator,
    validate,
    asyncHandler(CastController.createCast)
);

router.get(
    "/", [auth, role(ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER)],

    asyncHandler(CastController.getAllCasts)
);



router.get(
    "/:id",
    castIdValidator,validate,
    asyncHandler(CastController.getCastById)
);

router.put(
    "/:id", [auth, role(ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER)],updateCastValidator,
    validate,
    asyncHandler(CastController.updateCast)
);

router.delete(
    "/:id", [auth, role(ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER)],castIdValidator,
    validate,
    asyncHandler(CastController.deleteCast)
);

module.exports = router;
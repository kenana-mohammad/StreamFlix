const express = require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/asyncHandler");
const CastController = require("../controllers/cast.controller");

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");

const { ROLES } = require("../../../shared/constants/roles.constant");

// Admin APIs
router.post(
    "/",
    //[auth , role(ROLES.SUPER_ADMIN,ROLES.CONTENT_MANAGER)],
    asyncHandler(CastController.createCast)
);

router.get(
    "/",
    asyncHandler(CastController.getAllCasts)
);



router.get(
    "/:id",
    asyncHandler(CastController.getCastById)
);

router.put(
    "/:id",
    //[auth , role(ROLES.SUPER_ADMIN,ROLES.CONTENT_MANAGER)],
    asyncHandler(CastController.updateCast)
);

router.delete(
    "/:id",
    //[auth , role(ROLES.SUPER_ADMIN,ROLES.CONTENT_MANAGER)],
    asyncHandler(CastController.deleteCast)
);

module.exports = router;
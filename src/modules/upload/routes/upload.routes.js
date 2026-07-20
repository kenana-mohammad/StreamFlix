const express = require("express");
const router = express.Router();

const uploadController = require("../controllers/upload.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");
const upload = require("../../../middlewares/multer");

const { ROLES } = require("../../../shared/constants/roles");

router.post(
    "/video",
    [
        auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),  
        upload.single("video"),
    ],
    asyncHandler(uploadController.uploadVideo)
);

router.post(
    "/poster",
    [
        auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        upload.single("poster"),
    ],
    asyncHandler(uploadController.uploadPoster)
);

module.exports = router;
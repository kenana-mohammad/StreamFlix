const express = require("express");
const router = express.Router();

const uploadController = require("../controllers/upload.controller");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");
const { imageUpload , videoUpload } = require("../../../middlewares/multer");

const { ROLES } = require("../../../shared/constants/roles");
const { validateAllowedFolders ,validateFoldersWithFilesExtension } = require("../validations/validationDirectUpload");

router.post(
    "/video",
    [
        auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        videoUpload.single("video"),
    ],
    asyncHandler(uploadController.uploadVideo)
);

router.post(
    "/poster",
    [
        auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        imageUpload.single("poster"),
    ],
    asyncHandler(uploadController.uploadPoster)
);

router.delete(
    "/",
    [
        auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
    ],
    asyncHandler(uploadController.deleteFile)
);

router.post(
    "/signature",
    [
         auth,
        role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        validateAllowedFolders,
        validateFoldersWithFilesExtension
    ],
    asyncHandler(uploadController.generateSignature)
);  

module.exports = router;
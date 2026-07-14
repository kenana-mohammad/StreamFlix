const express = require("express");
const router = express.Router();

const genreController = require("../controllers/genre.controller");

const asyncHandler = require("../../../utils/asyncHandler");

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");

const { ROLES } = require("../../../shared/constants/roles.constant");

const {
    createGenreValidation,
    updateGenreValidation,
    idValidation
} = require("../validations/genre.validate");

const validate = require("../../../middlewares/validate");


// =======================
// Website APIs
// =======================

router.get(
    "/",
    asyncHandler(genreController.getAll)
);


// =======================
// Admin APIs
// =======================

router.post(
    "/", [
        // auth,
        // role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        ...createGenreValidation,

    ],
    asyncHandler(genreController.create)
);


router.get(
    "/admin", [
        // auth,
        // role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER])
    ],
    asyncHandler(genreController.getAllAdmin)
);


router.get(
    "/:id", [
        // auth,
        // role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        ...idValidation,
    ],
    asyncHandler(genreController.getById)
);


router.put(
    "/:id", [
        // auth,
        // role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        // ...updateGenreValidation,
    ],
    asyncHandler(genreController.update)
);


router.delete(
    "/:id", [
        // auth,
        // role([ROLES.SUPER_ADMIN, ROLES.CONTENT_MANAGER]),
        ...idValidation,
    ],
    asyncHandler(genreController.delete)
);


module.exports = router;
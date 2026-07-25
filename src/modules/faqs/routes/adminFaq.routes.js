const router = require("express").Router();

const controller = require("../controllers/faq.controller");

const auth = require("../../../middlewares/auth");
const role = require("../../../middlewares/role");
const validate = require("../../../middlewares/validate");

const { ROLES } = require("../../../shared/constants/roles.constant");

const {
    createFAQValidation,
    updateFAQValidation,
    deleteFAQValidation
} = require("../validations/faq.validation");

router.post(
    "/",
    auth,
    role([ROLES.SUPER_ADMIN]),
    createFAQValidation,
    validate,
    controller.createFAQ
);

router.put(
    "/:id",
    auth,
    role([ROLES.SUPER_ADMIN]),
    updateFAQValidation,
    validate,
    controller.updateFAQ
);

router.delete(
    "/:id",
    auth,
    role([ROLES.SUPER_ADMIN]),
    deleteFAQValidation,
    validate,
    controller.deleteFAQ
);

module.exports = router;
const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const validate = require("../../../middlewares/validate");
const id = require("../../../middlewares/id");
const asyncHandler = require("../../../utils/asyncHandler");
const auth = require("./../../../middlewares/auth");
const {
    createPlanValidation,
    updatePlanValidation
} = require("../validations/plan.validation");
const { ROLES } = require("../../../shared/constants/roles.constant");
const role = require("../../../middlewares/role");

// Public APIs
router.get("/",
    asyncHandler(planController.getAll));
// Front APIs
router.get(
    "/active",

    asyncHandler(planController.getActive)
);
router.get(
    "/:id",
    id,
    asyncHandler(planController.getById)
);

// Admin APIs
router.post(
    "/", [auth, role(ROLES.SUPER_ADMIN), ...createPlanValidation],

    asyncHandler(planController.create)
);

router.put(
    "/:id", [id,
        ...updatePlanValidation, auth, role(ROLES.SUPER_ADMIN)
    ], asyncHandler(planController.update)
);

router.delete(
    "/:id", [id, auth, role(ROLES.SUPER_ADMIN)],
    asyncHandler(planController.remove)
);

router.patch(
    "/:id/toggle-status", [id, auth, role(ROLES.SUPER_ADMIN)],
    asyncHandler(planController.toggleStatus)
);

module.exports = router;

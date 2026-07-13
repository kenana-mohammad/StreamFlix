const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const validate = require("../../../middlewares/validate");
const id = require("../../../middlewares/id");
const asyncHandler = require("../../../utils/asyncHandler");

const {
    createPlanValidation,
    updatePlanValidation
} = require("../validations/plan.validation");

// Public APIs
router.get("/", asyncHandler(planController.getAll));
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
    "/",
    createPlanValidation,
    validate,
    asyncHandler(planController.create)
);

router.put(
    "/:id",
    id,
    updatePlanValidation,
    validate,
    asyncHandler(planController.update)
);

router.delete(
    "/:id",
    id,
    asyncHandler(planController.remove)
);

router.patch(
    "/:id/toggle-status",
    id,
    asyncHandler(planController.toggleStatus)
);

module.exports = router;
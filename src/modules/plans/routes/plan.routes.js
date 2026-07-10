const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const validate = require("../../../middlewares/validate");
const id = require("../../../middlewares/id");

const {
    createPlanValidation,
    updatePlanValidation
} = require("../validations/plan.validation");

// Public APIs
router.get("/", planController.getAll);
router.get("/:id", id, planController.getById);

// Admin APIs
router.post("/", createPlanValidation, validate, planController.create);
router.put("/:id", id, updatePlanValidation, validate, planController.update);
router.delete("/:id", id, planController.remove);
router.patch("/:id/toggle-status", id, planController.toggleStatus);

module.exports = router;
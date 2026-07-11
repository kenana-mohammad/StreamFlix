const express = require("express");

const router = express.Router();

const CastController = require("../controllers/cast.controller");

const {
  createCastValidation,
  updateCastValidation,
} = require("../validations/cast.validation");

// Admin APIs
router.post("/", createCastValidation, CastController.createCast);

router.get("/", CastController.getAllCasts);

router.get("/search", CastController.searchCast);

router.get("/:id", CastController.getCastById);

router.put("/:id", updateCastValidation, CastController.updateCast);

router.delete("/:id", CastController.deleteCast);

module.exports = router;
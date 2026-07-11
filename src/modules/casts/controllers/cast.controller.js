const { validationResult } = require("express-validator");
const CastService = require("../services/cast.service");

// Create Cast
const createCast = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const cast = await CastService.createCast(req.body);

    return res.status(201).json({
      success: true,
      message: "Cast created successfully",
      data: cast,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Casts
const getAllCasts = async (req, res, next) => {
  try {
    const casts = await CastService.getAllCasts();

    return res.status(200).json({
      success: true,
      data: casts,
    });
  } catch (error) {
    next(error);
  }
};

// Get Cast By Id
const getCastById = async (req, res, next) => {
  try {
    const cast = await CastService.getCastById(req.params.id);

    if (!cast) {
      return res.status(404).json({
        success: false,
        message: "Cast not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: cast,
    });
  } catch (error) {
    next(error);
  }
};

// Update Cast
const updateCast = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const cast = await CastService.updateCast(req.params.id, req.body);

    if (!cast) {
      return res.status(404).json({
        success: false,
        message: "Cast not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cast updated successfully",
      data: cast,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Cast
const deleteCast = async (req, res, next) => {
  try {
    const cast = await CastService.deleteCast(req.params.id);

    if (!cast) {
      return res.status(404).json({
        success: false,
        message: "Cast not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cast deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Search Cast
const searchCast = async (req, res, next) => {
  try {
    const name = req.query.name || "";

    const casts = await CastService.searchCast(name);

    return res.status(200).json({
      success: true,
      data: casts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCast,
  getAllCasts,
  getCastById,
  updateCast,
  deleteCast,
  searchCast,
};
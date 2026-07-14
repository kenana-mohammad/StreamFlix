const { validationResult } = require("express-validator");
const CastService = require("../services/cast.service");

// Create Cast
const createCast = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    
    const { name , image , biography } = req.body;
    const cast = await CastService.createCast({ name, image, biography });

    return res.status(201).json({
        success: true,
        message: "Cast created successfully",
        data: cast,
    });

};

// Get All Casts
const getAllCasts = async (req, res) => {

    const casts = await CastService.getAllCasts();

    return res.status(200).json({
        success: true,
        data: casts,
    });

};

// Get Cast By Id
const getCastById = async (req, res) => {

    const cast = await CastService.getById(req.params.id);

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

};

// Update Cast
const updateCast = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }

    const cast = await CastService.update(req.params.id, req.body);

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

};

// Delete Cast
const deleteCast = async (req, res) => {

    const cast = await CastService.delete(req.params.id);

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

};

// Search Cast
const searchCast = async (req, res) => {

    const name = req.query.name || "";

    const casts = await CastService.searchCast(name);

    return res.status(200).json({
        success: true,
        data: casts,
    });

};

module.exports = {
    createCast,
    getAllCasts,
    getCastById,
    updateCast,
    deleteCast,
    searchCast,
};

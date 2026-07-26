const { body, param } = require("express-validator");
const validate = require("../../../middlewares/validate");


const addWatchlistValidation = [

    param("profileId")
        .notEmpty()
        .withMessage("Profile id is required")
        .isMongoId()
        .withMessage("Invalid profile id"),


    body("contentId")
        .notEmpty()
        .withMessage("Content id is required")
        .isMongoId()
        .withMessage("Invalid content id"),


    validate
];


const deleteWatchlistValidation = [

    param("profileId")
        .notEmpty()
        .withMessage("Profile id is required")
        .isMongoId()
        .withMessage("Invalid profile id"),


    param("contentId")
        .notEmpty()
        .withMessage("Content id is required")
        .isMongoId()
        .withMessage("Invalid content id"),


    validate
];


module.exports = {
    addWatchlistValidation,
    deleteWatchlistValidation
};
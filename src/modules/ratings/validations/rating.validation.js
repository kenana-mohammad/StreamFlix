const { body, param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const createRatingValidation = [

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

    body("rating")
        .notEmpty()
        .withMessage("Rating is required")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),

    body("review")
        .optional()
        .isString()
        .withMessage("Review must be a string")
        .isLength({ max: 1000 })
        .withMessage("Review must not exceed 1000 characters"),

    validate
];

module.exports = {
    createRatingValidation
};
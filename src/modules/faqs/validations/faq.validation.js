const { body, param } = require("express-validator");

const createFAQValidation = [
    body("question")
        .trim()
        .notEmpty()
        .withMessage("Question is required"),

    body("answer")
        .trim()
        .notEmpty()
        .withMessage("Answer is required"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean"),
];

const updateFAQValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid FAQ id"),

    body("question")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Question cannot be empty"),

    body("answer")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Answer cannot be empty"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean"),
];

const deleteFAQValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid FAQ id"),
];

module.exports = {
    createFAQValidation,
    updateFAQValidation,
    deleteFAQValidation,
};
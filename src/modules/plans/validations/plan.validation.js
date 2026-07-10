const { body } = require("express-validator");
const { QUALITY } = require("../../../shared/constants/quality.constant");

const createPlanValidation = [
    body("name")
        .notEmpty()
        .withMessage("Plan name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Plan name must be between 2 and 50 characters"),

    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ min: 0 })
        .withMessage("Price must be greater than or equal to 0"),

    body("duration")
        .notEmpty()
        .withMessage("Duration is required")
        .isInt({ min: 1 })
        .withMessage("Duration must be at least 1 day"),

    body("maxDevices")
        .notEmpty()
        .withMessage("Max devices is required")
        .isInt({ min: 1 })
        .withMessage("Max devices must be at least 1"),

    body("maxProfiles")
        .notEmpty()
        .withMessage("Max profiles is required")
        .isInt({ min: 1 })
        .withMessage("Max profiles must be at least 1"),

    body("quality")
        .notEmpty()
        .withMessage("Quality is required")
        .isIn(Object.values(QUALITY))
        .withMessage("Invalid quality"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be true or false")
];

const updatePlanValidation = [
    body("name")
        .optional()
        .isLength({ min: 2, max: 50 }),

    body("price")
        .optional()
        .isFloat({ min: 0 }),

    body("duration")
        .optional()
        .isInt({ min: 1 }),

    body("maxDevices")
        .optional()
        .isInt({ min: 1 }),

    body("maxProfiles")
        .optional()
        .isInt({ min: 1 }),

    body("quality")
        .optional()
        .isIn(Object.values(QUALITY)),

    body("isActive")
        .optional()
        .isBoolean()
];

module.exports = {
    createPlanValidation,
    updatePlanValidation
};
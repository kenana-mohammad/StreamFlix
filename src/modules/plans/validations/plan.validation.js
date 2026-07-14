const { body } = require("express-validator");
const { QUALITY } = require("../../../shared/constants/quality.constant");
const validate = require("../../../middlewares/validate");

const createPlanValidation = [
    (req, res, next) => {
        console.log("CREATE VALIDATION RUNNING");
        next();
    },
    body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

    body("name")
    .notEmpty()
    .withMessage("Plan name is required"),
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
    .withMessage("isActive must be a boolean (true or false)"),

    body("isLimited")
    .optional()
    .isBoolean()
    .withMessage("isLimited must be a boolean (true or false)"),

    body("maxMovies")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Max movies must be a positive number or 0"),

    body("maxSeries")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Max series must be a positive number or 0"),

    (req, res, next) => {
        if (
            req.body.isLimited === true &&
            (req.body.maxMovies === undefined || req.body.maxSeries === undefined)
        ) {
            return res.status(400).json({
                success: false,
                message: "Limited plans require maxMovies and maxSeries"
            });
        }

        next();
    },
    validate
];

const updatePlanValidation = [
    body("name")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Plan name must be between 2 and 50 characters"),
    body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

    body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be greater than or equal to 0"),

    body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),

    body("maxDevices")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max devices must be at least 1"),

    body("maxProfiles")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max profiles must be at least 1"),

    body("quality")
    .optional()
    .isIn(Object.values(QUALITY))
    .withMessage("Invalid quality"),

    body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean (true or false)"),

    body("isLimited")
    .optional()
    .isBoolean()
    .withMessage("isLimited must be a boolean (true or false)"),

    body("maxMovies")
    .custom((value, { req }) => {
        console.log("LIMITED VALUE:", req.body.isLimited);

        if (req.body.isLimited === true && value === undefined) {
            throw new Error("Max movies required for limited plans");
        }

        return true;
    }),
    body("maxSeries")
    .custom((value, { req }) => {
        if (req.body.isLimited === true && value === undefined) {
            throw new Error("Max series is required for limited plans");
        }

        if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
            throw new Error("Max series must be at least 1");
        }

        return true;
    }), validate
];

module.exports = {
    createPlanValidation,
    updatePlanValidation
};
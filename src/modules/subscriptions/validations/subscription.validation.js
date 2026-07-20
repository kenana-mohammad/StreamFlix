const { body } = require("express-validator");
const validate = require("../../../middlewares/validate");

const createSubscriptionValidation = [
    (req, res, next) => {
        console.log("SUBSCRIPTION CREATE VALIDATION RUNNING");
        next();
    },

    body("planId")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isMongoId()
    .withMessage("Invalid Plan ID format"),

    body("userId")
    .optional()
    .isMongoId()
    .withMessage("Invalid User ID format"),

    body("paymentMethod")
    .optional()
    .isString()
    .withMessage("Payment method must be a string")
    .isIn(["CreditCard", "PayPal", "Stripe", "Cash", "visa"])
    .withMessage("Invalid payment method"),

    body("currency")
    .optional()
    .isString()
    .withMessage("Currency must be a string")
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code (e.g., USD)"),

    body("autoRenew")
    .optional()
    .isBoolean()
    .withMessage("autoRenew must be a boolean (true or false)"),




    validate
];

module.exports = {
    createSubscriptionValidation
};
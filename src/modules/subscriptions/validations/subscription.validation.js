const { body, param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const createSubscriptionValidation = [


    param("planId")
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
    .isIn(['visa', 'mastercard', 'paypal', 'apple_pay', 'fawry']

    )
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
const renewManualValidation = [



    body("subscriptionId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Subscription ID format"),

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
    createSubscriptionValidation,
    renewManualValidation

};
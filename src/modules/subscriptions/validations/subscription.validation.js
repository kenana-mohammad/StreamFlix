const { body, param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const ALLOWED_PAYMENT_METHODS = ['visa', 'mastercard', 'paypal', 'stripe', 'apple_pay', 'fawry', 'cash'];

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
    // .isIn(['visa', 'mastercard', 'paypal', 'apple_pay', 'fawry'])
    .isIn(ALLOWED_PAYMENT_METHODS)
    // .withMessage("Invalid payment method"),
    .withMessage(`Invalid payment method. Allowed methods: ${ALLOWED_PAYMENT_METHODS.join(', ')}`),

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
    // .isIn(["CreditCard", "PayPal", "Stripe", "Cash", "visa"])
    .isIn(ALLOWED_PAYMENT_METHODS)
    // .withMessage("Invalid payment method"),
    .withMessage(`Invalid payment method. Allowed methods: ${ALLOWED_PAYMENT_METHODS.join(', ')}`),
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
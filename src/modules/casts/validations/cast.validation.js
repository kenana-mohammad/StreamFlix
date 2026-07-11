const { body } = require("express-validator");

const createCastValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 }),

  body("image")
    .optional()
    .isString(),

  body("biography")
    .optional()
    .isString(),
];

const updateCastValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 }),

  body("image")
    .optional()
    .isString(),

  body("biography")
    .optional()
    .isString(),
];

module.exports = {
  createCastValidation,
  updateCastValidation,
};
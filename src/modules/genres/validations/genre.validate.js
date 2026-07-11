const { body, param } = require("express-validator");


const createGenreValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Genre name is required"),

  body("description")
    .optional()
    .trim()
];


const updateGenreValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid genre id"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Genre name cannot be empty"),

  body("description")
    .optional()
    .trim()
];


const idValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid genre id")
];


module.exports = {
  createGenreValidation,
  updateGenreValidation,
  idValidation
};
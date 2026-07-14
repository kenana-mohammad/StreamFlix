const { body, param } = require("express-validator");

const validate = require("../../../middlewares/validate");

const createGenreValidation = [
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Genre name is required"),

    body("description")
    .optional()
    .trim(), validate
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
    .trim(), validate

];


const idValidation = [
    param("id")
    .isMongoId()
    .withMessage("Invalid genre id"), validate

];


module.exports = {
    createGenreValidation,
    updateGenreValidation,
    idValidation
};
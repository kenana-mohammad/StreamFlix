const { param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const addFavoriteValidation = [
    param("profileId")
        .isMongoId()
        .withMessage("Invalid profile id"),

    validate,
];

const removeFavoriteValidation = [
    param("profileId")
        .isMongoId()
        .withMessage("Invalid profile id"),

    param("contentId")
        .isMongoId()
        .withMessage("Invalid content id"),

    validate,
];

const getFavoritesValidation = [
    param("profileId")
        .isMongoId()
        .withMessage("Invalid profile id"),

    validate,
];

module.exports = {
    addFavoriteValidation,
    removeFavoriteValidation,
    getFavoritesValidation,
};
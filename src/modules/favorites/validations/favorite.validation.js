const { param, body } = require("express-validator");
const validate = require("../../../middlewares/validate");
const addFavoriteValidation = [
    body('contentId')
        .notEmpty()
        .withMessage('Content ID is required')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid content ID format');
            }
            return true;
        }),
];
const removeFavoriteValidation = [
   
    param("contentId")
        .isMongoId()
        .withMessage("Invalid content id"),

    validate,
];


module.exports = {
    addFavoriteValidation,
    removeFavoriteValidation
};
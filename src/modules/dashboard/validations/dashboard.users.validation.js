const { param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const userIdValidation = [
    param("userId")
    .isMongoId().withMessage("Invalid user ID"),

    validate
];


module.exports = {
  userIdValidation
};

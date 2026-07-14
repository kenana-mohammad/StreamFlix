const { param } = require("express-validator");
const validate = require("../../../middlewares/validate");

const userIdValidation = [
    param('id').isMongoId().withMessage('invalid Id'), validate,


];


module.exports = {
    userIdValidation
};
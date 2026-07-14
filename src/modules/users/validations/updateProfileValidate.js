const {
    body
} = require("express-validator");
const validate = require("./../../../middlewares/validate");

const updateProfileValidate = [

    body("name")
    .optional()
    .isString()
    .withMessage("الاسم يجب أن يكون نصاً")
    .isLength({
        min: 2,
        max: 100
    })
    .withMessage("الاسم يجب أن يكون بين 2 و100 محرف"),

    body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("رقم الهاتف غير صالح"),

    validate
];

module.exports = {
    updateProfileValidate
};
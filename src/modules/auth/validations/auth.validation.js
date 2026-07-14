const {
    body
} = require("express-validator");
const User = require("../../users/models/User");

const validate = require("./../../../middlewares/validate");
const registerValidate = [
    body("name")
    .isString()
    .withMessage("الاسم يجب أن يكون نصاً")
    .isLength({
        min: 2,
        max: 100
    })
    .withMessage("الاسم يجب أن يكون بين 2 و100 محرف"),

    body("email")
    .isEmail()
    .withMessage("البريد الإلكتروني غير صالح")
    .custom(async (value) => {

        const user = await User.findOne({
            email: value
        });

        if (user) {
            throw new Error("البريد الإلكتروني مستخدم مسبقاً");
        }

        return true;
    }),

    body("phone").
    if(body("phone").exists())
    .isMobilePhone()
    .withMessage("رقم الهاتف غير صالح"),

    body("password")
    .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    .withMessage("يجب استخدام كلمة مرور قوية"),

    validate
];
const loginValidate = [

    body('email').isString().withMessage('invaild email').isEmail().withMessage('invaild email'),

    body('password').isString().withMessage('Invalid password').isStrongPassword({
        minLength: 8,
        minLowercase: 2,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('Invalid password'),
    validate

]
const changeMyPasswordValidation = [
    body('oldPassword')
    .notEmpty().withMessage('كلمة المرور القديمة مطلوبة'),

    body('newPassword')
    .isString().withMessage('كلمة المرور يجب أن تكون نصية')
    .isStrongPassword({
        minLength: 8,
        minLowercase: 2,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage('كلمة المرور ضعيفة: يجب أن تحتوي على 8 أحرف على الأقل، حرفين صغيرين، حرف كبير، رقم، ورمز خاص'),

    body('newPassword')
    .custom((value, {
        req
    }) => {
        if (value === req.body.oldPassword) {
            throw new Error('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
        }
        return true;
    }),

    validate
];

module.exports = {
    registerValidate,
    loginValidate,
    changeMyPasswordValidation
};
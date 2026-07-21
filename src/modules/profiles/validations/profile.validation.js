const {body} = require("express-validator");
const validate = require("./../../../middlewares/validate");

const createProfileValidation = [
   body("name")
   .isString().withMessage("Name must be String")
   .isLength({
    min : 3,
    max : 50
   })
   .withMessage("Name should be between 3 and 50 characters")
   ,

   body("pin")
   .isString().withMessage("PIN must be string")
   .optional()
   .isLength(6).withMessage("PIN must be 6 characters or numbers")
   ,

   body("avatar")
   .optional()
   .isString().withMessage("Profile avatar must be string")
   ,

   body("isKids")
   .optional()
   .isBoolean().withMessage("isKids must be boolean"),

   body("minAge")
   .optional()
   .isNumeric().withMessage("minAge must be a number"),

   validate
]

const updateProfileValidation = [
  body("name")
  .optional()
   .isString().withMessage("Name must be String")
   .isLength({
    min : 3,
    max : 50
   })
   .withMessage("Name should be between 3 and 50 characters")
   ,

   body("avatar")
   .optional()
   .isString().withMessage("Profile avatar must be string")
   ,

   body("isKids")
   .optional()
   .isBoolean().withMessage("isKids must be boolean"),

   body("minAge")
   .optional()
   .isNumeric().withMessage("minAge must be a number"),

   validate

]

const pinValidation = [
   body("pin")
   .notEmpty().withMessage("PIN must not be empty!")
   .isString().withMessage("PIN must be string")
   .isLength(6).withMessage("PIN must be 6 characters or numbers")
   ,

   validate
]

const changePinValidation = [
   body("oldPin")
   .notEmpty().withMessage("PIN must not be empty!")
   .isString().withMessage("PIN must be string")
   ,
    body("newPin")
   .notEmpty().withMessage("PIN must not be empty!")
   .isString().withMessage("PIN must be string")
   .isLength(6).withMessage("PIN must be 6 characters or numbers")
   ,
   validate
]

module.exports = {
    createProfileValidation,
    updateProfileValidation,
    pinValidation,
    changePinValidation
};



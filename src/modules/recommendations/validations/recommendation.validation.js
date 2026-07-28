const { param} = require("express-validator");
const validate = require("./../../../middlewares/validate");


const getRecommendationsValidation = [
  param("profileId")
  .notEmpty().withMessage("profile Id is required")
  .isMongoId().withMessage("Profile Id must be valid"),

  validate
]

module.exports = {
    getRecommendationsValidation
};

const express = require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/asyncHandler");
const RecommendationController = require("../controllers/recommendation.controller");
const auth = require("../../../middlewares/Auth");
const validateProfileOwnership = require("../../../middlewares/validateProfileOwnership");
const { getRecommendationsValidation } = require("../validations/recommendation.validation");


//for testing only
// router.get("/profiles/:profileId/fav-genres",
//      [auth , validateProfileOwnership] ,
//      asyncHandler(RecommendationController.getFavoriteGenres) )

router.get("/profiles/:profileId/recommendations",
     [ getRecommendationsValidation, auth, validateProfileOwnership ],
      asyncHandler(RecommendationController.getPersonalizedRecommendation))


module.exports = router;
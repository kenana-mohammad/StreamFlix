const express = require("express");
const router = express.Router();

const asyncHandler = require("../../../utils/asyncHandler");
const RecommendationController = require("../controllers/recommendation.controller");
const auth = require("../../../middlewares/Auth");
const validateProfileToken = require("../../../middlewares/validateProfileToken");


//for testing only
// router.get("/profiles/:profileId/fav-genres",
//      [auth , validateProfileOwnership] ,
//      asyncHandler(RecommendationController.getFavoriteGenres) )

router.get("/profiles/recommendations",
     [ auth, validateProfileToken ],
      asyncHandler(RecommendationController.getPersonalizedRecommendation))


module.exports = router;
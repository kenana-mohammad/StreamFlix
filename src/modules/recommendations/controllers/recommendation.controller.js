const AppError = require("../../../shared/errors/AppError");
const { successResponse } = require("../../../shared/helpers/api-response.helper");
const RecommendationService = require("../services/recommendation.services")


class RecommendationController {

    getFavoriteGenres = async (req, res) => {
      const profileId = req.params.profileId;
      if (!profileId) {
        throw new AppError("Profile Id is required" , 400)
      }
      const topGenres = await RecommendationService.getFavoriteGenres(profileId , 3)

      return successResponse(res, 200,
        "Fav genres according to the watch history has been successfully fetched",
        topGenres
      )
   }
    
   getPersonalizedRecommendation = async (req, res) => {
      const profileId = req.params.profileId;
       if (!profileId) {
        throw new AppError("Profile Id is required" , 400)
      }
      const personalizedRecommendation = await RecommendationService.getRecommendations(profileId)

      return successResponse(res, 200,
        "Personalized recommendation according to the watch history has been successfully fetched",
        personalizedRecommendation
      )
   }
}

module.exports = new RecommendationController()
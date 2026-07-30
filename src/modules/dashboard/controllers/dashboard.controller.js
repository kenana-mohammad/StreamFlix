const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardService = require("../services/dashboard.service");

class DashboardController {

    async getDashboardData(req, res) {
        const stats = await DashboardService.getStats();

        return successResponse(
            res,
            200,
            "Dashboard statistics retrieved successfully",
            stats
        );
    }

   
    // Recent Ratings
    
    async getRecentRatings(req, res) {
        const ratings = await DashboardService.getRecentRatings();

        return successResponse(
            res,
            200,
            "Recent ratings retrieved successfully",
            ratings
        );
    }

}

module.exports = new DashboardController();
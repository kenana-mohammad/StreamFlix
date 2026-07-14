const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardService = require("../services/dashboard.service");


class DashboardController {

  async getDashboardData(req, res) {
    const stats = await DashboardService.getStats();
    if (!stats) {
        return errorResponse(res, 404, "Dashboard statistics not found");
    }
       return successResponse(res, 200, 
            "Dashboard statistics retrieved successfully",
            { data: stats }
        );
  }
}
module.exports = new DashboardController();

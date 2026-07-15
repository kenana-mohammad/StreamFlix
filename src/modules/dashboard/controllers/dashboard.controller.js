const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardService = require("../services/dashboard.service");


class DashboardController {

    async getDashboardData(req, res) {
        const stats = await DashboardService.getStats();

        return successResponse(res, 200, "Dashboard statistics retrieved successfully", stats);
    }
}
module.exports = new DashboardController();
const { successResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardService = require("../services/dashboard.service");


class DashboardController {

    async getDashboardData(req, res) {
        const stats = await DashboardService.getStats();

        return successResponse(res, 200, "Dashboard statistics retrieved successfully", stats);
    }

    async getHistoryAnalytics(req, res) {
        const analytics = await DashboardService.getHistoryAnalytics();

        return successResponse(
            res,
            200,
            "Watch history analytics retrieved successfully",
            analytics
        );
    }
}
module.exports = new DashboardController();

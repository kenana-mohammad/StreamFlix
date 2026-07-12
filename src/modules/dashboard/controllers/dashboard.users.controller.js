const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardUserService = require("../services/dashboard.users.service");

class DashboardUsersController {
    async searchUser (req, res) {
         const { query } = req.query;
         const users = await DashboardUserService.searchUser(query);
         if(!users) {
            return errorResponse(res, 404, "No users found matching the search criteria");
         }
         return successResponse(res, 200, 
            "User search results retrieved successfully", 
            { data: users });
    }

    async getUserInfo(req, res) {
        const { userId } = req.params;
        const userInfo = await DashboardUserService.getUserInfo(userId);
        if(!userInfo) {
            return errorResponse(res, 404, "User not found");
        }

        return successResponse(res, 200,
            "User information retrieved successfully",
            { data: userInfo }
        )

    }


    async enableAccount(req, res) {
        const { userId } = req.params;
        const userEnabled = await DashboardUserService.enableAccount(userId);
        if(!userEnabled) {
            return errorResponse(res, 404, "User not found");
        }

        return successResponse(res, 200,
            "User's Account Enabled Successfully",
            { data: userEnabled }
        )
    }

    async disableAccount (req, res) {
        const { userId } = req.params;
        const userDisabled = await DashboardUserService.disableAccount(userId);
        if(!userDisabled) {
            return errorResponse(res, 404, "User not found");
        }

        return successResponse(res, 200,
            "User's Account Disabled Successfully",
            { data: userDisabled }
        )
    }
}

module.exports = new DashboardUsersController();
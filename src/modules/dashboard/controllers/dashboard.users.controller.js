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
            users
        );
    }

    async getUserInfo(req, res) {
        const { id } = req.params;
        const { userInfo , profileCount , userProfiles } = await DashboardUserService.getUserInfo(id);
        if(!userInfo) {
            return errorResponse(res, 404, "User not found");
        }

        return successResponse(res, 200,
            "User information retrieved successfully",
            { data: userInfo, profileCount: profileCount || 0, userProfiles: userProfiles || [] }
        );

    }


    async enableAccount(req, res) {
        const { id } = req.params;
        const { userEnabled, subscription } = await DashboardUserService.enableAccount(id);
        if(!userEnabled) {
            return errorResponse(res, 404, "User not found");
        }

        if (!subscription) {
            return successResponse(res, 200,
                "User's Account Enabled Successfully",
                { data: userEnabled }
            )
        }
        else {
            return successResponse(res, 200,
                "User's Account and subscription Enabled Successfully",
                { data: userEnabled , subscription }
            )
        }
    }

    async disableAccount (req, res) {
        const { id } = req.params;
        const { userDisabled, subscription } = await DashboardUserService.disableAccount(id);
        if(!userDisabled) {
            return errorResponse(res, 404, "User not found");
        }
        
        if (!subscription) {
            return successResponse(res, 200,
                "User's Account Disabled Successfully",
                { data: userDisabled }
            )
        }
        else {
            return successResponse(res, 200,
                "User's Account and subscription Disabled Successfully",
                { data: userDisabled, subscription }
            )
        }
    }

    async createContentManager(req, res) {
        const { name, email, password, phone } = req.body;
        const contentManager = await DashboardUserService.createContentManager(
            name,
           email,
           password,
           phone
       );
       if(!contentManager) {
           return errorResponse(res, 404, "Failed to create content manager");
       }

       return successResponse(res, 200,
           "Content manager created successfully",
           { data: contentManager }
       )
    }
}

module.exports = new DashboardUsersController();
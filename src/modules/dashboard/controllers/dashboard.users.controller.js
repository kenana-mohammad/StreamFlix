const { successResponse, errorResponse } = require("../../../shared/helpers/api-response.helper");
const DashboardUserService = require("../services/dashboard.users.service");

class DashboardUsersController {

    getUsers = async(req, res) => {
        const users = await DashboardUserService.getUsers(req.query.query);

        const message = users.length > 0 ?
            "Results found" :
            "No users match your search";

        return successResponse(res, 200, message, users);
    };

    async getUserInfo(req, res) {
        const { id } = req.params;
        const { userInfo, profileCount, userProfiles } = await DashboardUserService.getUserInfo(id);


        return successResponse(res, 200,
            "User information retrieved successfully", { data: userInfo, profileCount: profileCount || 0, userProfiles: userProfiles || [] }
        );

    }


    async updateAccountStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const { userStatusUpdated, subscription } = await DashboardUserService.updateAccountStatus(id, status);


        return successResponse(res, 200,
            "User's Account Status Updated Successfully", { data: userStatusUpdated, subscription: subscription || "NOT SUBSCRIBED" }
        )
    }



    async createContentManager(req, res) {
        const { name, email, password, phone } = req.body;
        const contentManager = await DashboardUserService.createContentManager(
            name,
            email,
            password,
            phone
        )



        return successResponse(res, 200,
            "Content manager created successfully",
            contentManager
        )
    }
}

module.exports = new DashboardUsersController();
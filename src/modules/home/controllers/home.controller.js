const homeService = require("../services/home.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class HomeController {

    getHome = async (req, res) => {

        const data = await homeService.getHomeData();

        return successResponse(
            res,
            200,
            "Home data fetched successfully",
            data
        );
    };

}

module.exports = new HomeController();
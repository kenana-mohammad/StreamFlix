const planService = require("../services/plan.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class PlanController {

    getAll = async(req, res) => {
        const plans = await planService.getAll();

        return successResponse(
            res,
            200,
            "Plans fetched successfully",
            plans
        );
    };


    getActive = async(req, res) => {
        const plans = await planService.getActive();

        return successResponse(
            res,
            200,
            "Active plans fetched successfully",
            plans
        );
    };


    getById = async(req, res) => {
        const plan = await planService.getById(req.params.id);

        return successResponse(
            res,
            200,
            "Plan fetched successfully",
            plan
        );
    };


    create = async(req, res) => {
        const {
            name,
            description,
            price,
            duration,
            maxDevices,
            maxProfiles,
            quality,
            isLimited,
            maxMovies,
            maxSeries
        } = req.body;

        const planData = {
            name,
            description,
            price,
            duration,
            maxDevices,
            maxProfiles,
            quality,
            isLimited,
            maxMovies,
            maxSeries
        };
        const plan = await planService.create(planData);

        return successResponse(
            res,
            201,
            "Plan created successfully",
            plan
        );
    };


    update = async(req, res) => {
      
const {
            name,
            description,
            price,
            duration,
            maxDevices,
            maxProfiles,
            quality,
            isLimited,
            maxMovies,
            maxSeries
        } = req.body;

        const planData = {
            name,
            description,
            price,
            duration,
            maxDevices,
            maxProfiles,
            quality,
            isLimited,
            maxMovies,
            maxSeries
        };
        const plan = await planService.update(
            req.params.id,
            planData
        );

        return successResponse(
            res,
            200,
            "Plan updated successfully",
            plan
        );
    };


    remove = async(req, res) => {
        await planService.remove(req.params.id);

        return successResponse(
            res,
            200,
            "Plan deleted successfully"
        );
    };


    toggleStatus = async(req, res) => {
        const plan = await planService.toggleStatus(req.params.id);

        return successResponse(
            res,
            200,
            "Plan status updated",
            plan
        );
    };

}

module.exports = new PlanController();
module.exports = new PlanController();
module.exports = new PlanController();
module.exports = new PlanController();
module.exports = new PlanController();
module.exports = new PlanController();
const planService = require("../services/plan.service");
const asyncHandler = require("../../../utils/asyncHandler");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class PlanController {

   getAll = asyncHandler(async (req, res) => {
    const plans = await planService.getAll();

    return successResponse(
        res,
        200,
        "Plans fetched successfully",
        plans
    );
});

    getById = asyncHandler(async (req, res) => {
    const plan = await planService.getById(req.params.id);

    return successResponse(
        res,
        200,
        "Plan fetched successfully",
        plan
    );
});

   create = asyncHandler(async (req, res) => {
    const plan = await planService.create(req.body);

    return successResponse(
        res,
        201,
        "Plan created successfully",
        plan
    );
});

   update = asyncHandler(async (req, res) => {
    const plan = await planService.update(
        req.params.id,
        req.body
    );

    return successResponse(
        res,
        200,
        "Plan updated successfully",
        plan
    );
});

    remove = asyncHandler(async (req, res) => {
    await planService.remove(req.params.id);

    return successResponse(
        res,
        200,
        "Plan deleted successfully"
    );
});

    toggleStatus = asyncHandler(async (req, res) => {
    const plan = await planService.toggleStatus(req.params.id);

    return successResponse(
        res,
        200,
        "Plan status updated",
        plan
    );
});

}

module.exports = new PlanController();
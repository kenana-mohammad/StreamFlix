const seriesService = require('../services/series.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const asyncHandler = require('../../../utils/asyncHandler');

class SeriesController {
    create = asyncHandler(async (req, res) => {
        const result = await seriesService.createSeries(req.body);
        return successResponse(res, 201, 'Series created successfully', result);    });

    getAllForAdmin = asyncHandler(async (req, res) => {
        const series = await seriesService.getSeries(true); 
        return successResponse(res, 200, 'All series fetched successfully', series);
    });

    getByIdForAdmin = asyncHandler(async (req, res) => {
        const series = await seriesService.getSeriesById(req.params.id, true);
        return successResponse(res, 200, 'Series details fetched successfully', series);
    });

    getAllForClient = asyncHandler(async (req, res) => {
        const series = await seriesService.getSeries(false); 
        return successResponse(res, 200, 'Available series fetched successfully', series);
    });

    getByIdForClient = asyncHandler(async (req, res) => {
        const series = await seriesService.getSeriesById(req.params.id, false);
        return successResponse(res, 200, 'Series details fetched successfully', series);
    });

    update = asyncHandler(async (req, res) => {
        const series = await seriesService.updateSeries(req.params.id, req.body);
        return successResponse(res, 200, 'Series updated successfully', series);
    });

    changeStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const series = await seriesService.changeStatus(req.params.id, status);
        return successResponse(res, 200, 'Series status updated successfully', series);
    });

    delete = asyncHandler(async (req, res) => {
        await seriesService.deleteSeries(req.params.id);
        return successResponse(res, 200, 'Series deleted successfully', null);
    });
}

module.exports = new SeriesController();
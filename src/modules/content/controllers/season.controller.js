const seasonService = require('../services/season.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const asyncHandler = require('../../../utils/asyncHandler');

class SeasonController {
    create = asyncHandler(async (req, res) => {
        const season = await seasonService.createSeason(req.body);
        return successResponse(res, 201, 'Season created successfully', season);
    });

    getBySeries = asyncHandler(async (req, res) => {
        const isAdmin = req._user && req._user.role === 'admin';
        const seasons = await seasonService.getSeasonsBySeriesId(req.params.seriesId, isAdmin);
        return successResponse(res, 200, 'The season of this series fetched successfully', seasons);
    });

    update = asyncHandler(async (req, res) => {
        const season = await seasonService.updateSeason(req.params.id, req.body);
        return successResponse(res, 200, 'Season updated successfully', season);
    });

    changeStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const season = await seasonService.changeStatus(req.params.id, status);
        return successResponse(res, 200, 'Season status updated successfully', season);
    });

    delete = asyncHandler(async (req, res) => {
        await seasonService.deleteSeason(req.params.id);
        return successResponse(res, 200, 'Season deleted successfully', null);
    });
}

module.exports = new SeasonController();
const seasonService = require('../services/season.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');

class SeasonController {
    create = async(req, res) => {
        const { seasonNumber, title } = req.body;
        const data = { seasonNumber, title };
        const { seriesId } = req.params;
        const season = await seasonService.createSeason(data, seriesId);
        return successResponse(res, 201, 'Season created successfully', season);
    };

    getBySeries = async(req, res) => {
        const { seriesId } = req.params;
        const isStaff = req._user && ['admin', 'content_manager'].includes(req._user.role);
        const seasons = await seasonService.getSeasonsBySeriesId(seriesId, isStaff);
        return successResponse(res, 200, 'The season of this series fetched successfully', seasons);
    };

    update = async(req, res) => {
        const { id } = req.params;
        const { seasonNumber, title } = req.body;
        const data = { seasonNumber, title };

        const season = await seasonService.updateSeason(id, data);
        return successResponse(res, 200, 'Season updated successfully', season);
    };

    changeStatus = async(req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        const season = await seasonService.changeStatus(id, status);
        return successResponse(res, 200, 'Season status updated successfully', season);
    };

    delete = async(req, res) => {
        const { id } = req.params;
        await seasonService.deleteSeason(id);
        return successResponse(res, 200, 'Season deleted successfully', null);
    };
}

module.exports = new SeasonController();
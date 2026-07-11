const episodeService = require('../services/episode.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const asyncHandler = require('../../../utils/asyncHandler');

class EpisodeController {
    create = asyncHandler(async (req, res) => {
        const episode = await episodeService.createEpisode(req.body);
        return successResponse(res, 201, 'Episode created successfully', episode);
    });

    getById = asyncHandler(async (req, res) => {
    const isAdmin = req._user && req._user.role === 'admin';
    const episode = await episodeService.getEpisodeById(req.params.id, isAdmin);
    
    return successResponse(res, 200, 'Episode fetched successfully', episode);
});

    getBySeason = asyncHandler(async (req, res) => {
        const isAdmin = req._user && req._user.role === 'admin';
        const episodes = await episodeService.getEpisodesBySeasonId(req.params.seasonId, isAdmin);
        return successResponse(res, 200, 'The episodes for this season fetched successfully', episodes);
    });

    update = asyncHandler(async (req, res) => {
        const episode = await episodeService.updateEpisode(req.params.id, req.body);
        return successResponse(res, 200, 'Episode updated successfully', episode);
    });

    changeStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const episode = await episodeService.changeStatus(req.params.id, status);
        return successResponse(res, 200, 'Episode status updated successfully', episode);
    });

    delete = asyncHandler(async (req, res) => {
        await episodeService.deleteEpisode(req.params.id);
        return successResponse(res, 200, 'Episode deleted successfully', null);
    });
}

module.exports = new EpisodeController();
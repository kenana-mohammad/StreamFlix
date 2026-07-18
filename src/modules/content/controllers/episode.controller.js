const episodeService = require('../services/episode.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');

class EpisodeController {
    create = async(req, res) => {
        const { episodeNumber, title, description, duration, videoUrl } = req.body;
        const { seasonId } = req.params;
        const data = { episodeNumber, title, description, duration, videoUrl };

        const episode = await episodeService.createEpisode(data, seasonId);
        return successResponse(res, 201, 'Episode created successfully', episode);
    };

    getById = async(req, res) => {
        const { id } = req.params;
        const isStaff = req._user && ['admin', 'content_manager'].includes(req._user.role);
        const episode = await episodeService.getEpisodeById(id, isStaff);
        return successResponse(res, 200, 'Episode fetched successfully', episode);
    };

    getBySeason = async(req, res) => {
        const { seasonId } = req.params;
        const isStaff = req._user && ['admin', 'content_manager'].includes(req._user.role);

        const episodes = await episodeService.getEpisodesBySeasonId(seasonId, isStaff);
        return successResponse(res, 200, 'The episodes for this season fetched successfully', episodes);
    };

    update = async(req, res) => {
        const { id } = req.params;
        const { episodeNumber, title, description, duration, videoUrl } = req.body;
        const data = { episodeNumber, title, description, duration, videoUrl };

        const episode = await episodeService.updateEpisode(id, data);
        return successResponse(res, 200, 'Episode updated successfully', episode);
    };

    changeStatus = async(req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        const episode = await episodeService.changeStatus(id, status);
        return successResponse(res, 200, 'Episode status updated successfully', episode);
    };

    delete = async(req, res) => {
        const { id } = req.params;
        await episodeService.deleteEpisode(id);
        return successResponse(res, 200, 'Episode deleted successfully', null);
    };
}

module.exports = new EpisodeController();
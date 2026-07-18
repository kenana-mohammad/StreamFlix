const relationService = require('../services/content-relation.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');

class ContentRelationController {

    // Genres Controllers

    addGenres = async (req, res) => {
        const { id } = req.params;
        const { genreIds } = req.body;
        const data = await relationService.addGenres(id, genreIds);
        return successResponse(res, 201, 'Genres added successfully to content', data);
    };

    removeGenre = async (req, res) => {
        const { id, genreId } = req.params;
        await relationService.removeGenre(id, genreId);
        return successResponse(res, 200, 'Genre removed successfully from content');
    };

    getContentGenres = async (req, res) => {
        const { id } = req.params;
        const data = await relationService.getContentGenres(id);
        return successResponse(res, 200, 'Content genres fetched successfully', data);
    };

    getContentByGenre = async (req, res) => {
        const { genreId } = req.params;
        const data = await relationService.getContentByGenre(genreId);
        return successResponse(res, 200, 'Content fetched successfully by genre', data);
    };

    // Cast Controllers

    addCast = async (req, res) => {
        const { id } = req.params;
        const { castId, characterName } = req.body;
        const data = await relationService.addCast(id, castId, characterName);
        return successResponse(res, 201, 'Cast added successfully to content', data);
    };

    updateCast = async (req, res) => {
        const { id, castId } = req.params;
        const { characterName } = req.body;
        const data = await relationService.updateCastCharacter(id, castId, characterName);
        return successResponse(res, 200, 'Cast character updated successfully', data);
    };

    removeCast = async (req, res) => {
        const { id, castId } = req.params;
        await relationService.removeCast(id, castId);
        return successResponse(res, 200, 'Cast removed successfully from content');
    };

    getContentCast = async (req, res) => {
        const { id } = req.params;
        const data = await relationService.getContentCast(id);
        return successResponse(res, 200, 'Content cast fetched successfully', data);
    };

    getContentByCast = async (req, res) => {
        const { castId } = req.params;
        const data = await relationService.getContentByCast(castId);
        return successResponse(res, 200, 'Content fetched successfully by cast member', data);
    };
}

module.exports = new ContentRelationController();
const ContentGenre = require('../models/ContentGenre');
const ContentCast = require('../models/ContentCast');
const AppError = require('../../../shared/errors/AppError');

class ContentRelationService {

    // Genres Relations
    
    async addGenres(contentId, genreIds) {
        const existingGenres = await ContentGenre.find({ contentId });
        const existingGenreIds = existingGenres.map(g => g.genreId.toString());

        const newGenres = genreIds
            .filter(id => !existingGenreIds.includes(id.toString()))
            .map(genreId => ({ contentId, genreId }));

        if (newGenres.length > 0) {
            await ContentGenre.insertMany(newGenres);
        }
        return await this.getContentGenres(contentId);
    }

    async removeGenre(contentId, genreId) {
        const deleted = await ContentGenre.findOneAndDelete({ contentId, genreId });
        if (!deleted) throw new AppError('Genre relation not found for this content', 404);
        return true;
    }

    async getContentGenres(contentId) {
        return await ContentGenre.find({ contentId }).populate('genreId', 'name description');
    }

    async getContentByGenre(genreId) {
        return await ContentGenre.find({ genreId }).populate('contentId');
    }

    // Cast Relations 

    async addCast(contentId, castId, characterName) {
        const existing = await ContentCast.findOne({ contentId, castId });
        if (existing) {
            throw new AppError('Cast member is already added to this content', 400);
        }
        return await ContentCast.create({ contentId, castId, characterName });
    }

    async updateCastCharacter(contentId, castId, characterName) {
        const updated = await ContentCast.findOneAndUpdate(
            { contentId, castId },
            { characterName },
            { new: true, runValidators: true }
        );
        if (!updated) throw new AppError('Cast relation not found in this content', 404);
        return updated;
    }

    async removeCast(contentId, castId) {
        const deleted = await ContentCast.findOneAndDelete({ contentId, castId });
        if (!deleted) throw new AppError('Cast relation not found', 404);
        return true;
    }

    async getContentCast(contentId) {
        return await ContentCast.find({ contentId }).populate('castId', 'name image biography');
    }

    async getContentByCast(castId) {
        return await ContentCast.find({ castId }).populate('contentId');
    }
}

module.exports = new ContentRelationService();
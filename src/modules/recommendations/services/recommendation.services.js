const mongoose = require('mongoose');
const Content = require('../../content/models/Content');
const WatchHistory = require('../../watch-history/models/WatchHistory');
const ContentGenre = require("../../content/models/ContentGenre");
const contentService = require('../../content/services/content.service');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');


class RecommendationService {
      
    // Helper function 
      getWatchedContentIds = async (profileId) => {

        // Get the profile's watch history
        const history = await WatchHistory.find({ profileId });

        // filter the history with 80% or more progress time watched
        const watchedIds = history
            .filter(h => h.completed || h.progressTime >= h.totalDuration * 0.8)
            .map(h => h.contentId.toString());
        
        return [...new Set(watchedIds)];
    };

/////////////////////

  getFavoriteGenres = async (profileId, limit = 3) => {

        const watchedContentIds = await this.getWatchedContentIds(profileId);
        
        if (!watchedContentIds.length) return [];

        // Convert string IDs to ObjectIds for the query
        const objectIds = watchedContentIds.map(id => new mongoose.Types.ObjectId(id));
        
        // find the gernres for the content in history
        const genres = await ContentGenre.find({ 
            contentId: { $in: objectIds } 
        }).populate('genreId', 'name');

        if (!genres.length) return [];
        
        // count each genre
        const counts = {};
        genres.forEach(doc => {
            if (!doc.genreId) return;
            
            const id = doc.genreId._id.toString();
            const name = doc.genreId.name;
            
            if (!counts[id]) {
                counts[id] = { id, name, count: 0 };
            }
            counts[id].count += 1;
        });
        // return the top 3 favorite genres with their Id and count
        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(({ id, name, count }) => ({ id, name, count }));
    };



/////////////////////////////

     getRecommendations = async (profileId, limit = 10) => {
        
            const favouriteGenres = await this.getFavoriteGenres(profileId, 3);
            
            if (!favouriteGenres || !favouriteGenres.length) {
                return await contentService.getTopRated();
            }

            const genreIds = favouriteGenres.map(g => g.id);

            // Use helper to get watched content
            const watchedContent = await this.getWatchedContentIds(profileId);
            
            // Get content in favorite genres
            const contentIds = await ContentGenre.find({
                genreId: { $in: genreIds }
            }).distinct('contentId');

            // Filter out watched content
            const unwatchedIds = contentIds.filter(id => 
                !watchedContent.includes(id.toString())
            );
            
            // if there is no unwatched content in the favorite genres , return the top rated
            if (!unwatchedIds.length) {
                return await contentService.getTopRated();
            }
            
            // fetch the recommendations after excluding the already watched content and sort it
            const recommendations = await Content.find({
                _id: { $in: unwatchedIds },
                status: CONTENT_STATUS.PUBLISHED
            })
            .sort({ averageRating: -1, viewsCount: -1 })
            .limit(limit);

            
            if (!recommendations.length) {
               return await contentService.getTopRated();
            }

            // Add genres to response
            const recIds = recommendations.map(c => c._id);
            const contentGenres = await ContentGenre.find({
                contentId: { $in: recIds }
            }).populate('genreId', 'name');

            const genresMap = {};
            contentGenres.forEach(cg => {
                const id = cg.contentId.toString();
                if (!genresMap[id]) genresMap[id] = [];
                if (cg.genreId) {
                    genresMap[id].push({
                        _id: cg.genreId._id,
                        name: cg.genreId.name
                    });
                }
            });

            const result = recommendations.map(content => {
                const obj = content.toObject();
                obj.genres = genresMap[content._id.toString()] || [];
                return obj;
            });

            //console.log(' Recommendations:', result.length);
            return result;

    }
}

module.exports = new RecommendationService()
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

        if (!history.length) return [];

        // filter the history with 80% or more progress time watched
        const watchedIds = history
            .filter(h => h.completed || h.progressTime >= h.totalDuration * 0.8)
            .map(h => h.contentId.toString());
        
        // remove duplicates 
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

         // Filter out records without genreId before counting
        const validGenres = genres.filter(doc => doc.genreId);
        
         if (!validGenres.length) {
            return [];
        }

        // count each genre
          const counts = validGenres.reduce((acc, doc) => {
            const id = doc.genreId._id.toString();
            const name = doc.genreId.name;
            
            if (!acc[id]) {
                acc[id] = { id, name, count: 0 };
            }
            acc[id].count += 1;
            
            return acc;
        }, {});
        
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
            
        // If there is no unwatched content in the favorite genres , return the top rated
        if (!unwatchedIds.length) {
            return await contentService.getTopRated();
        }
            
        // Fetch the recommendations after excluding the already watched content and sort it
            const recommendations = await Content.find({
                _id: { $in: unwatchedIds },
               status: CONTENT_STATUS.PUBLISHED
                })
                .populate({
                 path: 'genres',
                 populate: {
                    path: 'genreId',
                    select: 'name'
                }
            }) 
            .sort({ averageRating: -1, viewsCount: -1 })
            .limit(limit);

            
        if (!recommendations.length) {
            return await contentService.getTopRated();
        }
        // Transform to clean genre format
        const result = recommendations.map(content => {
        const obj = content.toObject();
        
        // Clean up genres
        obj.genres = (obj.genres || [])
        .filter(cg => cg.genreId)  // Remove null/undefined
        .map(cg => {
        if (typeof cg.genreId === 'object' && cg.genreId.name) {
                return {
                    _id: cg.genreId._id,
                    name: cg.genreId.name
                };
            }
            return { _id: cg.genreId };
            });
        
        return obj;
        });

        return result;

    }
}

module.exports = new RecommendationService()
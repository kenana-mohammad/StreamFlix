const Rating = require("../models/Rating");
const Content = require("../../content/models/Content");
const AppError = require("../../../shared/errors/AppError");

class RatingService {

    /**
     * Update the average rating and total rating count for a Content item
     */
    async updateContentRating(contentId) {
        const ratings = await Rating.find({ contentId });
        const ratingCount = ratings.length;
        const averageRating = ratingCount === 0
            ? 0
            : ratings.reduce((sum, item) => sum + item.rating, 0) / ratingCount;

        await Content.findByIdAndUpdate(contentId, {
            averageRating: parseFloat(averageRating.toFixed(1)),
            ratingCount
        });
    }


   /**
     * Create or update a rating safely (Upsert)
     */
    async createOrUpdate(data) {
        const { profileId, contentId, rating, review } = data;

        // Check if the content exists
        const content = await Content.findById(contentId);
        if (!content) {
            throw new AppError("Content not found", 404);
        }

        // Check if a rating already exists to determine if it's new
        const existingRating = await Rating.findOne({ profileId, contentId });
        const isNew = !existingRating;

        // Upsert: update if exists, create if not
        const updatedOrCreatedRating = await Rating.findOneAndUpdate(
            { profileId, contentId },
            {
                rating,
                review: review || (existingRating ? existingRating.review : undefined),
                isUpdated: !isNew
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Update content statistics
        await this.updateContentRating(contentId);

        return {
            rating: updatedOrCreatedRating,
            isNew
        };
    }
    /**
     * Get a specific profile's rating for a specific content
     */
    async getMyRating(profileId, contentId) {
        const rating = await Rating.findOne({
            profileId,
            contentId
        }).populate({
            path: "contentId",
            select: "title poster type"
        });

        if (!rating) {
            return null; // Return null instead of throwing an error
        }

        return rating;
    }


    /**
     * Get all ratings made by a specific profile
     */
    async getMyRatings(profileId) {
        return await Rating.find({ profileId })
            .populate({
                path: "contentId",
                select: "title poster type averageRating"
            })
            .sort({ createdAt: -1 });
    }


    /**
     * Get all ratings for a specific content along with statistics
     */
    async getContentRatings(contentId) {
        const ratings = await Rating.find({ contentId })
            .populate({
                path: "profileId",
                select: "name avatar" 
            })
            .sort({ createdAt: -1 });

        // Calculate statistics
        const total = ratings.length;
        const averageRating = total === 0
            ? 0
            : ratings.reduce((sum, r) => sum + r.rating, 0) / total;

        // Rating distribution (1-5 stars)
        const distribution = {
            5: ratings.filter(r => r.rating === 5).length,
            4: ratings.filter(r => r.rating === 4).length,
            3: ratings.filter(r => r.rating === 3).length,
            2: ratings.filter(r => r.rating === 2).length,
            1: ratings.filter(r => r.rating === 1).length
        };

        // Format ratings for presentation
        const formattedRatings = ratings.map(r => ({
            _id: r._id,
            rating: r.rating,
            review: r.review,
            isUpdated: r.isUpdated,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            profile: {
                _id: r.profileId?._id,
                name: r.profileId?.name || "User",
                avatar: r.profileId?.avatar || null
            }
        }));

        return {
            total,
            averageRating: parseFloat(averageRating.toFixed(1)),
            distribution,
            ratings: formattedRatings
        };
    }


    /**
     * Get recent ratings (For Admin dashboard)
     */
    async getRecentRatings() {
        return await Rating.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({
                path: "profileId",
                select: "name avatar"
            })
            .populate({
                path: "contentId",
                select: "title poster type"
            });
    }


    /**
     * Delete a rating (For Admin)
     */
    async deleteRating(id) {
        const rating = await Rating.findById(id);

        if (!rating) {
            throw new AppError("Rating not found", 404);
        }

        const contentId = rating.contentId;

        await Rating.findByIdAndDelete(id);

        // Update content statistics after deletion
        await this.updateContentRating(contentId);

        return true;
    }

}

module.exports = new RatingService();
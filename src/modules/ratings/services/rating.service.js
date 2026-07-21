const Rating = require("../models/rating");
const Content = require("../../content/models/Content");

class RatingService {

    async updateContentRating(contentId) {

        const ratings = await Rating.find({ contentId });

        const ratingCount = ratings.length;

        const averageRating =
            ratingCount === 0
                ? 0
                : ratings.reduce(
                    (sum, item) => sum + item.rating,
                    0
                ) / ratingCount;

        await Content.findByIdAndUpdate(
            contentId,
            {
                averageRating,
                ratingCount
            }
        );
    }

    async create(data) {

        const existingRating = await Rating.findOne({
            profileId: data.profileId,
            contentId: data.contentId
        });

        let rating;

        if (existingRating) {

            existingRating.rating = data.rating;
            existingRating.review = data.review;
            existingRating.isUpdated = true;

            rating = await existingRating.save();

        } else {

            rating = await Rating.create({
                profileId: data.profileId,
                contentId: data.contentId,
                rating: data.rating,
                review: data.review
            });

        }

        await this.updateContentRating(data.contentId);

        return rating;
    }

    async getMyRatings() {

        return await Rating.find();

    }

    async getContentRating(contentId) {

        return await Rating.find({ contentId });

    }

}

module.exports = new RatingService();
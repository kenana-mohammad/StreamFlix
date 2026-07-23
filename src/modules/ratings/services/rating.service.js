const Rating = require("../models/Rating");
const Content = require("../../content/models/Content");
const Profile = require("../../profiles/models/Profile");

class RatingService {

    async getProfileByUserId(userId) {
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            throw new Error("Profile not found");
        }

        return profile;
    }

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

        const profile = await this.getProfileByUserId(data.userId);

        const profileId = profile._id;

        const existingRating = await Rating.findOne({
            profileId,
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
                profileId,
                contentId: data.contentId,
                rating: data.rating,
                review: data.review
            });
        }

        await this.updateContentRating(data.contentId);

        return rating;
    }

    async getMyRatings(userId) {

        const profile = await this.getProfileByUserId(userId);

        return await Rating.find({
            profileId: profile._id
        });
    }

    async getContentRating(contentId) {

        return await Rating.find({ contentId });
    }
}

module.exports = new RatingService();
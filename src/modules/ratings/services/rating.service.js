const WatchHistory = require("../../watch-history/models/WatchHistory");
const Rating = require("../models/rating");
const Content = require("../../content/models/Content");
const Profile = require("../../profiles/models/Profile");
const Subscription = require("../../subscriptions/models/Subscription");
const { SUBSCRIPTION_STATUS } = require("../../../shared/constants/subscription-status.constant");

class RatingService {

    async checkWatchHistory(profileId, contentId) {

    const watch = await WatchHistory.findOne({
        profileId,
        contentId
    });

    if (!watch) {
        throw new Error("You must watch this content before rating");
    }

    return watch;
}
    async getProfileByUserId(userId) {
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            throw new Error("Profile not found");
        }

        return profile;
    }

    async checkActiveSubscription(userId) {

        const subscription = await Subscription.findOne({
            userId,
            status: SUBSCRIPTION_STATUS.ACTIVE
        });

        if (!subscription) {
            throw new Error("Active subscription required");
        }

        return subscription;
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

        await Content.findByIdAndUpdate(contentId, {
            averageRating,
            ratingCount
        });
    }

    async create(data) {

        const profile = await this.getProfileByUserId(data.userId);

await this.checkActiveSubscription(data.userId);

const profileId = profile._id;

await this.checkWatchHistory(profileId, data.contentId);

        

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
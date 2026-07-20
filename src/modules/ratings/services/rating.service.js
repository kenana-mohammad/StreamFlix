const Rating = require("../models/Rating");
const Content = require("../../content/models/Content");
const AppError = require("../../../shared/errors/AppError");

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


    async update(contentId, data) {

        const rating = await Rating.findOne({ contentId });


        if (!rating) {
            throw new AppError("Rating not found", 404);
        }


        rating.rating = data.rating ?? rating.rating;
        rating.review = data.review ?? rating.review;
        rating.isUpdated = true;


        const updatedRating = await rating.save();


        await this.updateContentRating(contentId);


        return updatedRating;

    }


    async remove(contentId) {

        const rating = await Rating.findOneAndDelete({ contentId });


        if (!rating) {
            throw new AppError("Rating not found", 404);
        }


        await this.updateContentRating(contentId);


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
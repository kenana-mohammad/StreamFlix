const Rating = require("../models/Rating");
const Content = require("../../content/models/Content");
const Profile = require("../../profiles/models/Profile");

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


        await Content.findByIdAndUpdate(contentId, {
            averageRating,
            ratingCount
        });
    }



    async checkProfile(profileId, userId) {

        const profile = await Profile.findOne({
            _id: profileId,
            userId: userId
        });


        if (!profile) {

            throw new Error("Invalid profile or unauthorized");

        }


        return profile;
    }



    async create(data) {


        // Check Content exists
        const content = await Content.findById(data.contentId);


        if (!content) {

            throw new Error("Content not found");

        }



        // Check Profile exists and belongs to user
        const profile = await this.checkProfile(
            data.profileId,
            data.userId
        );


        const profileId = profile._id;



        const existingRating = await Rating.findOne({
            profileId,
            contentId: data.contentId
        });



        if (existingRating) {

            throw new Error("You already rated this content");

        }



        const rating = await Rating.create({

            profileId,

            contentId: data.contentId,

            rating: data.rating,

            review: data.review

        });



        await this.updateContentRating(data.contentId);



        return rating;
    }




    async update(data) {


        await this.checkProfile(
            data.profileId,
            data.userId
        );


        const rating = await Rating.findOne({

            profileId: data.profileId,

            contentId: data.contentId

        });



        if (!rating) {

            throw new Error("Rating not found");

        }



        rating.rating = data.rating;

        rating.review = data.review;

        rating.isUpdated = true;



        await rating.save();



        await this.updateContentRating(data.contentId);



        return rating;
    }





    async getMyRating(userId, contentId) {


        const profile = await Profile.findOne({
            userId
        });



        if (!profile) {

            throw new Error("Profile not found");

        }



        const rating = await Rating.findOne({

            profileId: profile._id,

            contentId

        });



        if (!rating) {

            throw new Error("Rating not found");

        }



        return rating;

    }





    async getMyRatings(userId) {


        const profile = await Profile.findOne({
            userId
        });



        if (!profile) {

            throw new Error("Profile not found");

        }



        return await Rating.find({

            profileId: profile._id

        });

    }





    async getContentRating(contentId) {


        return await Rating.find({
            contentId
        })

        .populate({

            path: "profileId",

            select: "name avatar"

        });

    }





    async getRecentRatings() {


        return await Rating.find()

        .sort({
            createdAt: -1
        })

        .limit(10)

        .populate({

            path: "profileId",

            select: "name"

        })

        .populate({

            path: "contentId",

            select: "title"

        });

    }





    async deleteRating(id) {


        const rating = await Rating.findById(id);



        if (!rating) {

            throw new Error("Rating not found");

        }



        const contentId = rating.contentId;



        await Rating.findByIdAndDelete(id);



        await this.updateContentRating(contentId);



        return true;

    }

}


module.exports = new RatingService();
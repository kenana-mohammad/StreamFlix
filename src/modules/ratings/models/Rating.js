const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema({
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    isUpdated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Rating', ratingSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const favoriteSchema = new Schema({
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

//prevent duplicates
favoriteSchema.index(
    { profileId: 1, contentId: 1 }, 
    { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

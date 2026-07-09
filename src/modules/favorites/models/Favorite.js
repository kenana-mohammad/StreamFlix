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

module.exports = mongoose.model('Favorite', favoriteSchema);

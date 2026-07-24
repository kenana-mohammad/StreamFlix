const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
        index: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

watchlistSchema.index({ profileId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
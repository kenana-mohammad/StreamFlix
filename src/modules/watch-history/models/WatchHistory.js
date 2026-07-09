const mongoose = require('mongoose');
const { Schema } = mongoose;

const watchHistorySchema = new Schema({
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
    episodeId: {
        type: Schema.Types.ObjectId,
        ref: 'Episode',
        default: null
    },
    progressTime: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDuration: {
        type: Number,
        required: true,
        min: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    watchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WatchHistory', watchHistorySchema);

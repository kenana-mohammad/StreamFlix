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
        required: true,
        index: true
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
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== 'production'
});

watchHistorySchema.index(
    { profileId: 1, contentId: 1 },
    { unique: true, name: 'unique_profile_content_history' }
);

// updatedAt changes on every viewing activity, so retention is one year after last use.
watchHistorySchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60, name: 'watch_history_retention' }
);

watchHistorySchema.index(
    { profileId: 1, watchedAt: -1 },
    { name: 'profile_recent_history' }
);

module.exports = mongoose.model('WatchHistory', watchHistorySchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const viewEventSchema = new Schema({
    viewSessionId: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 128
    },
    viewedAt: {
        type: Date,
        required: true
    }
}, {
    _id: false
});

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
    },
    stoppedAt: {
        type: Date,
        default: null
    },
    viewSessionId: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 128,
        default: null
    },
    viewSessionIds: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 128
    }],
    viewEvents: {
        type: [viewEventSchema],
        default: [],
        select: false
    }
}, {
    timestamps: true,
    autoIndex: false
});

watchHistorySchema.index(
    { profileId: 1, contentId: 1 },
    { unique: true, name: 'unique_profile_content_history' }
);

watchHistorySchema.index(
    { updatedAt: 1 },
    {
        expireAfterSeconds: 365 * 24 * 60 * 60,
        name: 'watch_history_one_year_retention'
    }
);

watchHistorySchema.index({ profileId: 1, updatedAt: -1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);

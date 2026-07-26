const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
    CONTENT_TYPE
} = require('../../../shared/constants/content-type.constant');

const contentViewEventSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    contentType: {
        type: String,
        enum: {
            values: Object.values(CONTENT_TYPE),
            message: 'Content type is invalid'
        },
        required: true
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null
    },
    periodStart: {
        type: Date,
        default: null
    },
    periodEnd: {
        type: Date,
        default: null
    },
    viewSessionId: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 128
    },
    viewedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true,
    autoIndex: false
});

contentViewEventSchema.index(
    {
        profileId: 1,
        contentId: 1,
        viewSessionId: 1
    },
    {
        unique: true,
        name: 'unique_profile_content_view_session'
    }
);

contentViewEventSchema.index({
    contentId: 1,
    viewedAt: -1
});

contentViewEventSchema.index({
    viewedAt: 1
});

contentViewEventSchema.index({
    userId: 1,
    viewedAt: -1
});

contentViewEventSchema.index({
    subscriptionId: 1,
    contentType: 1,
    viewedAt: 1
});

module.exports = mongoose.model('ContentViewEvent', contentViewEventSchema);

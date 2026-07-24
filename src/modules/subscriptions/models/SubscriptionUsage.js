const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');

const subscriptionUsageSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
        index: true
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
    periodStart: {
        type: Date,
        required: true
    }
}, {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== 'production'
});

subscriptionUsageSchema.index(
    {
        subscriptionId: 1,
        periodStart: 1,
        profileId: 1,
        contentId: 1
    },
    { unique: true, name: 'unique_subscription_period_view' }
);

subscriptionUsageSchema.index({
    userId: 1,
    subscriptionId: 1,
    periodStart: 1,
    contentType: 1
});

module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);

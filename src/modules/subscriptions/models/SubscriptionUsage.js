const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionUsageSchema = new Schema({

    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
        unique: true
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    moviesUsedCount: {
        type: Number,
        default: 0,
        min: 0
    },

    seriesUsedCount: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    'SubscriptionUsage',
    subscriptionUsageSchema
);
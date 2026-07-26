// models/SubscriptionUsage.js
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
        default: 0
    },
    seriesUsedCount: {
        type: Number,
        default: 0
    },
    periodStart: {
        type: Date,
        default: null
    },
    periodEnd: {
        type: Date,
        default: null
    },
    movieViewKeys: [{
        type: String
    }],
    seriesViewKeys: [{
        type: String
    }]
}, {
    timestamps: true
});

subscriptionUsageSchema.index({
    userId: 1,
    subscriptionId: 1
});

subscriptionUsageSchema.path('moviesUsedCount').validate({
    validator: Number.isInteger,
    message: 'Movie usage must be an integer'
});

subscriptionUsageSchema.path('seriesUsedCount').validate({
    validator: Number.isInteger,
    message: 'Series usage must be an integer'
});

subscriptionUsageSchema.path('moviesUsedCount').validate({
    validator: value => value >= 0,
    message: 'Movie usage cannot be negative'
});

subscriptionUsageSchema.path('seriesUsedCount').validate({
    validator: value => value >= 0,
    message: 'Series usage cannot be negative'
});

module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);

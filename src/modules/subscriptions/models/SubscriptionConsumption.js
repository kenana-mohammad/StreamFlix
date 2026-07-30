const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionConsumptionSchema = new Schema({

    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },

    contentType: {
        type: String,
        enum: ['movie', 'series'],
        required: true
    },

    consumedAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

/**
 * نفس الاشتراك لا يستهلك نفس المحتوى مرتين
 */
subscriptionConsumptionSchema.index({
    subscriptionId: 1,
    contentId: 1
}, {
    unique: true
});

module.exports = mongoose.model(
    'SubscriptionConsumption',
    subscriptionConsumptionSchema
);
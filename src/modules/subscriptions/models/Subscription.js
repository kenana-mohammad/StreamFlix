const mongoose = require('mongoose');
const { Schema } = mongoose;
const { SUBSCRIPTION_STATUS } = require('../../../shared/constants/subscription-status.constant');

const subscriptionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: {
            values: Object.values(SUBSCRIPTION_STATUS),
            message: 'حالة الاشتراك غير صالحة'
        },
        default: SUBSCRIPTION_STATUS.PENDING
    },
    autoRenew: {
        type: Boolean,
        default: false
    },

    notes: {
        type: String
    },
    usage: {
        movies: {
            type: Number,
            default: 0,
            min: 0
        },
        series: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    consumedViewKeys: {
        type: [String],
        default: [],
        // Short-lived reservations prevent concurrent requests from consuming
        // the same profile/content allowance before the usage ledger is written.
        select: false
    }
}, {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== 'production',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
subscriptionSchema.virtual('startDateFormatted').get(function() {
    if (!this.startDate) return null;
    return this.startDate.toISOString().split('T')[0]; // صيغة YYYY-MM-DD
});
subscriptionSchema.virtual('endDateFormatted').get(function() {
    if (!this.endDate) return null;
    return this.endDate.toISOString().split('T')[0]; // صيغة YYYY-MM-DD
});

subscriptionSchema.index({ userId: 1, status: 1, startDate: 1, endDate: 1 });
subscriptionSchema.index(
    { userId: 1 },
    {
        unique: true,
        name: 'one_active_subscription_per_user',
        partialFilterExpression: {
            status: SUBSCRIPTION_STATUS.ACTIVE,
            userId: { $type: 'objectId' }
        }
    }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);

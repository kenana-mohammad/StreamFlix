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
    }
}, {
    timestamps: true,
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


module.exports = mongoose.model('Subscription', subscriptionSchema);

module.exports = mongoose.model('Subscription', subscriptionSchema);
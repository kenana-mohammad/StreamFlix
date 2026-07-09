const mongoose = require('mongoose');
const { Schema } = mongoose;
const { SUBSCRIPTION_STATUS } = require('../../../shared/constants/subscription-status.constant');

const subscriptionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    activatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentProof: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

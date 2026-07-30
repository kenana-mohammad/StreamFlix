const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
    },
    paymentMethod: {
        type: String,
        enum: ['visa', 'mastercard', 'paypal', 'apple_pay', 'fawry'],
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
    }
}, {
    timestamps: true
});

paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
//hook
paymentSchema.post('save', async function(doc, next) {
    if (doc.status === 'completed') {
        await mongoose.model('Subscription').findByIdAndUpdate(
            doc.subscriptionId, { status: 'active' }
        );
    }
    next();
});
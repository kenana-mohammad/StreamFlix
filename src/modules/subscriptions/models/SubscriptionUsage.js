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
    }
}, {
    timestamps: true
});

/**
 * @param {ObjectId} userId 
 * @param {Object} plan (بيانات الباقة)
 * @param {ObjectId} subscriptionId 
 * @param {String} contentType ('movie' أو 'series')
 */
subscriptionUsageSchema.statics.checkAndConsume = async function(userId, plan, subscriptionId, contentType) {
    if (!plan.isLimited) {
        return;
    }

    let usage = await this.findOne({ subscriptionId });
    if (!usage) {
        usage = await this.create({
            subscriptionId,
            userId,
            moviesUsedCount: 0,
            seriesUsedCount: 0
        });
    }

    // 3. الفحص والخصم بناءً على نوع المحتوى
    if (contentType === 'movie') {
        if (usage.moviesUsedCount >= plan.maxMovies) {
            const AppError = require('./../../../shared/errors/AppError');
            // عدل مسار الـ Error حسب مشروعك
            throw new AppError("لقد استنفدت الحد الأقصى للأفلام المسموحة في باقتك.", 403);
        }
        usage.moviesUsedCount += 1;
    } else if (contentType === 'series') {
        if (usage.seriesUsedCount >= plan.maxSeries) {
            const AppError = require('./../../../shared/errors/AppError');
            throw new AppError("لقد استنفدت الحد الأقصى للمسلسلات المسموحة في باقتك يمكننك الترقية", 403);
        }
        usage.seriesUsedCount += 1;
    }

    await usage.save();
};

module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
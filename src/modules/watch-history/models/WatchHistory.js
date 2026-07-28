const mongoose = require('mongoose');
const { Schema } = mongoose;

const watchHistorySchema = new Schema({
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

    episodeId: {
        type: Schema.Types.ObjectId,
        ref: 'Episode',
        default: null
    },

    progressTime: {
        type: Number,
        default: 0,
        min: 0
    },

    totalDuration: {
        type: Number,
        required: true,
        min: 1
    },

    completed: {
        type: Boolean,
        default: false
    },

    /**
     * TTL: يُحذف السجل تلقائياً بعد سنة من آخر قيمة هنا.
     * بما أن watchedAt يتحدّث مع كل مشاهدة/تحديث Progress،
     * فالحذف يصير فقط لو مرّت سنة كاملة بدون أي عودة للمحتوى من هذا البروفايل.
     */
    watchedAt: {
        type: Date,
        default: Date.now,
        expires: 31536000 // 365 يوم بالثواني
    }
}, {
    timestamps: true
});

/**
 * الفيلم: Profile + Content = سجل واحد
 */
// watchHistorySchema.index({
//     profileId: 1,
//     contentId: 1
// }, {
//     unique: true,
//     partialFilterExpression: { episodeId: null }
// });


/**
 * المسلسل: Profile + Content + Episode = سجل واحد
 */
// watchHistorySchema.index({
//     profileId: 1,
//     contentId: 1,
//     episodeId: 1
// }, {
//     unique: true,
//     partialFilterExpression: { episodeId: { $ne: null } }
// });

watchHistorySchema.index({
    profileId: 1,
    contentId: 1,
    episodeId: 1
}, {
    unique: true,
    name: 'unique_profile_content_episode'
});

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
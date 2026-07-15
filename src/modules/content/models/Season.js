const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

const seasonSchema = new Schema({
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: 'Series',
        required: true
    },
    seasonNumber: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    // status: {
    //     type: String,
    //     enum: {
    //         values: Object.values(CONTENT_STATUS),
    //         message: 'Season status is invalid'
    //     },
    //     default: CONTENT_STATUS.DRAFT
    // }
}, {
    timestamps: true
});

seasonSchema.virtual('episodes', {
    ref: 'Episode',
    localField: '_id',
    foreignField: 'seasonId'
});

seasonSchema.set('toObject', { virtuals: true });
seasonSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Season', seasonSchema);
const mongoose = require('mongoose');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');

const {
    Schema
} = mongoose;

const episodeSchema = new Schema({
    seasonId: {
        type: Schema.Types.ObjectId,
        ref: 'Season',
        required: true
    },
    episodeNumber: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    videoUrl: {
        type: String,
        required: true
    },
    // status: {
    //     type: String,
    //     enum: {
    //         values: Object.values(CONTENT_STATUS),
    //         message: 'Episode status is invalid'
    //     },
    //     default: CONTENT_STATUS.DRAFT
    // }
}, {
    timestamps: true
});

module.exports = mongoose.model('Episode', episodeSchema);
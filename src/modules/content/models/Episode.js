const mongoose = require('mongoose');
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Episode', episodeSchema);
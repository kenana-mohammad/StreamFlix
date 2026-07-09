const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

const contentCastSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    castId: {
        type: Schema.Types.ObjectId,
        ref: 'Cast',
        required: true
    },
    characterName: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ContentCast', contentCastSchema);
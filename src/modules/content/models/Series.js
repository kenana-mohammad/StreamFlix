const mongoose = require('mongoose');
const { Schema } = mongoose;

const seriesSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        unique: true
    },
    totalSeasons: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Series', seriesSchema);

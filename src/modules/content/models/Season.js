const mongoose = require('mongoose');
const { Schema } = mongoose;

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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Season', seasonSchema);

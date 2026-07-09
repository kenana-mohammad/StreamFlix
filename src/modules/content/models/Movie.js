const mongoose = require('mongoose');
const { Schema } = mongoose;

const movieSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        unique: true
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

module.exports = mongoose.model('Movie', movieSchema);

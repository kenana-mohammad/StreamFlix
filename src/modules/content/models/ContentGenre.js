const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

const contentGenreSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    genreId: {
        type: Schema.Types.ObjectId,
        ref: 'Genre',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ContentGenre', contentGenreSchema);
const mongoose = require('mongoose');
const { Schema } = mongoose;

const genreSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
         trim: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Genre', genreSchema);
const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

const profileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    pin: {
        type: String,
    },
    isKids: {
        type: Boolean,
        default: false
    },
    minAge: {
        type: Number,
        default: 18
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
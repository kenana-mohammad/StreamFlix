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

// ==========================================
// Cascade Delete Middleware
// ==========================================
genreSchema.pre('findOneAndDelete', async function() {
    const genreId = this.getQuery()['_id'];
    
    if (genreId) {
        await mongoose.model('ContentGenre').deleteMany({ genreId: genreId });
    }
    next();
});

module.exports = mongoose.model('Genre', genreSchema);
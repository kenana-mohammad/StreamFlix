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

seriesSchema.virtual('seasons', {
    ref: 'Season', 
    localField: '_id', 
    foreignField: 'seriesId' 
});

seriesSchema.set('toObject', { virtuals: true });
seriesSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Series', seriesSchema);

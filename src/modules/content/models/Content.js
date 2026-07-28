const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');
const { AGE_RATING } = require('../../../shared/constants/age-rating.constant');

const contentSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: {
            values: Object.values(CONTENT_TYPE),
            message: 'Content type is invalid'
        },
        required: true
    },
    poster: {
        type: String,
        required: true
    },
    ageRating: {
        type: String,
        enum: {
            values: Object.values(AGE_RATING),
            message: 'Age rating is invalid'
        },
        required: true
    },
    trailerUrl: {
        type: String
    },
    releaseYear: {
        type: Number,
        required: true
    },
    viewsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: {
            values: Object.values(CONTENT_STATUS),
            message: 'Content status is invalid'
        },
    },
    publishAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true,
     toJSON: { virtuals: true },   
     toObject: { virtuals: true }
});

contentSchema.virtual('genres', {
    ref: 'ContentGenre',
    localField: '_id',
    foreignField: 'contentId',
    justOne: false,
    populate: {
        path: 'genreId',
        select: 'name'
    }
});
// ==========================================
// Cascade Delete Middleware
// ==========================================
contentSchema.pre('findOneAndDelete', async function() {
    const contentId = this.getQuery()['_id'];
    const session = this.getOptions().session; 

    if (contentId) {
        await mongoose.model('ContentGenre').deleteMany({ contentId }).session(session);
        await mongoose.model('ContentCast').deleteMany({ contentId }).session(session);
    }
});



module.exports = mongoose.model('Content', contentSchema);
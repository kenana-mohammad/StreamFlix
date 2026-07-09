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
            message: 'نوع المحتوى غير صالح'
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
            message: 'تصنيف العمر غير صالح'
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
            message: 'حالة المحتوى غير صالحة'
        },
        default: CONTENT_STATUS.DRAFT
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);

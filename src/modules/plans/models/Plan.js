const mongoose = require('mongoose');
const { QUALITY } = require('../../../shared/constants/quality.constant');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم الباقة مطلوب'],
        trim: true
    },

    price: {
        type: Number,
        required: [true, 'السعر مطلوب'],
        min: [0, 'السعر لا يمكن أن يكون سالباً']
    },

    duration: {
        type: Number,
        required: [true, 'مدة الاشتراك مطلوبة'],
        min: [1, 'المدة يجب أن تكون يوم واحد على الأقل']
    },

    maxDevices: {
        type: Number,
        required: [true, 'عدد الأجهزة مطلوب'],
        min: [1, 'يجب السماح بجهاز واحد على الأقل']
    },

    maxProfiles: {
        type: Number,
        required: [true, 'عدد الملفات الشخصية مطلوب'],
        min: [1, 'يجب السماح بملف شخصي واحد على الأقل']
    },

    quality: {
        type: String,
        required: [true, 'جودة البث مطلوبة'],
        enum: {
            values: Object.values(QUALITY),
            message: 'الجودة المحددة غير مدعومة'
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

    isLimited: {
        type: Boolean,
        default: false
    },

    maxMovies: {
        type: Number,
        default: 0,
        min: [0, 'عدد الأفلام لا يمكن أن يكون سالباً']
    },

    maxSeries: {
        type: Number,
        default: 0,
        min: [0, 'عدد المسلسلات لا يمكن أن يكون سالباً']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
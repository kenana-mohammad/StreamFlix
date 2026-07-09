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
        enum: {
            values: Object.values(QUALITY),
            message: 'جودة غير صالحة'
        },
        required: [true, 'جودة العرض مطلوبة']
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);

const mongoose = require('mongoose');
const {
    ROLES
} = require('../../../shared/constants/roles.constant');
const {
    USER_STATUS
} = require('../../../shared/constants/user-status.constant');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'الاسم مطلوب'],
        trim: true
    },

    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        select: false
    },

    role: {
        type: String,
        enum: {
            values: Object.values(ROLES),
            message: 'دور غير صالح'
        },
        default: ROLES.USER
    },

    status: {
        type: String,
        enum: {
            values: Object.values(USER_STATUS),
            message: 'حالة غير صالحة'
        },
        default: USER_STATUS.ACTIVE
    },

    failedLoginAttempts: {
        type: Number,
        default: 0,
        min: 0
    },

    phone: {
        type: String,
        trim: true,
default:null
    },

    lockUntil: {
        type: Date,
        default: null
    },

    lastLogin: {
        type: Date,
        default: null
    },

    bannedReason: {
        type: String,
        default: null
    },

    bannedUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
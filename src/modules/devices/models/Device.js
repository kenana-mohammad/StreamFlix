const mongoose = require('mongoose');
const {
    Schema
} = mongoose;
const {
    DEVICE_TYPE
} = require('../../../shared/constants/device-type.constant');

const deviceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceName: {
        type: String,
        required: true
    },
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    deviceType: {
        type: String,
        enum: {
            values: Object.values(DEVICE_TYPE),
            message: 'نوع الجهاز غير صالح'
        },
        required: true
    },
    ipAddress: {
        type: String,
    },
    lastActive: {
        type: Date,
        default: Date.now
    } 
}, {
    timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema);
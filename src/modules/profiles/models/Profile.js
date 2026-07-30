const mongoose = require('mongoose');
const { USER_STATUS } = require('../../../shared/constants/user-status.constant');
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
        type: String
    },
    isKids: {
        type: Boolean,
        default: false
    },
    minAge: {
        type: Number,
        default: 18
    },
    primaryProfile: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: {
            values: Object.values(USER_STATUS),
            message: "Unaccepted Value"
        },
        default: USER_STATUS.ACTIVE
    }
}, {
    timestamps: true,
   toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

profileSchema.virtual('isPinProtected').get(function() {
    return !!this.pin;
});


profileSchema.index({ userId: 1 });

profileSchema.index({ userId: 1, primaryProfile: 1 }, {
    unique: true,
    partialFilterExpression: { primaryProfile: true }
});

module.exports = mongoose.model('Profile', profileSchema);
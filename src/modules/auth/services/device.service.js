const Device = require("./../../devices/models/Device");
const useragent = require("useragent");
const {
    v4: uuidv4
} = require("uuid");
const registerOrUpdateDevice = async (userId, deviceData) => {
    // deviceData يحتوي على: { deviceId, deviceType, ipAddress, userAgent }

    const device = await Device.findOneAndUpdate({
        userId,
        deviceId: deviceData.deviceId || uuidv4()
    }, {
        $set: {
            deviceName: useragent.parse(deviceData.userAgent).toString(),
            deviceType: deviceData.deviceType || "web",
            ipAddress: deviceData.ipAddress,
            lastActive: new Date()
        }
    }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });

    return device;
};
module.exports = {
    registerOrUpdateDevice
};
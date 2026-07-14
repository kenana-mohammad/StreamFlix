const Device = require("../models/Device");

class DeviceService {
    async getMyDevice(userId) {
        const myDevices = await Device.find({
            userId: userId
        });

        if (myDevices.length === 0) {
            throw {
                statusCode: 404,
                message: "لا يوجد أجهزة"
            };
        }
        return myDevices;
    }
    async deleteDevice(deviceId, userId) {
        // استخدم findOneAndDelete للقيام بالبحث والحذف في استعلام واحد
        const deletedDevice = await Device.findOneAndDelete({
            _id: deviceId,
            userId
        });

        if (!deletedDevice) {
            const error = new Error("الجهاز غير موجود أو ليس لديك صلاحية لحذفه");
            error.statusCode = 404;
            throw error;
        }

        return true;
    }

}
module.exports = new DeviceService()
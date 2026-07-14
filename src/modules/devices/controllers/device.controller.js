const {
    successResponse
} = require("../../../shared/helpers/api-response.helper");
const Device = require("../models/Device");
const deviceService = require("../services/device.service");

class DeviceController {
    getMyDevice = async (req, res) => {
        const userId = req._user.id;
        const myDevices = await deviceService.getMyDevice(userId)
        return successResponse(res, 200, 'عرض  الاجهزة', myDevices);
    }

    deleteDevice = async (req, res) => {

        const {
            id
        } = req.params;
        const userId = req._user.id;

        await deviceService.deleteDevice(id, userId);

        return successResponse(res, 200, 'تم حذف الجهاز بنجاح');
    }



}

module.exports = new DeviceController()
//
const cookiesService = require('../utils/cookiesService');
const jwtService = require('./../utils/jwtService');
const {
    errorResponse
} = require("./../shared/helpers/api-response.helper");
const Device = require('../modules/devices/models/Device');
const auth = async(req, res, next) => {
    try {
        const token = cookiesService.getAccessToken(req)

        if (!token) {

            return errorResponse(res, 403, "يجب تسجيل الدخول");
        }
        const decoded = jwtService.verifyAccessToken(token);
        req._user = {
            ...decoded
        }
        console.log(req._user = {
            ...decoded
        })
        const device = await Device.findOne({
            userId: decoded.id,
            deviceId: decoded.deviceId
        });


        if (!device) {

            cookiesService.clearTokens(res);

            return res.status(401).json({
                message: "تم تسجيل الخروج من هذا الجهاز"
            });

        }
        console.log(decoded)

        next()

    } catch (error) {

        return errorResponse(res, 403, "التوكين غير صالح أو انتهت صلاحيته");
    }

}
module.exports = auth
module.exports = auth
module.exports = auth
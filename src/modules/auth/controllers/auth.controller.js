const passwordService = require("./../../../utils/passwordService");
const jwtService = require("./../../../utils/jwtService");
const cookiesService = require("./../../../utils/cookiesService");
const User = require("./../../users/models/User");
const useragent = require('useragent');
const deviceService = require("./../services/device.service");
const {
    successResponse
} = require("./../../../shared/helpers/api-response.helper");
const {
    v4: uuidv4
} = require('uuid');
const {
    USER_STATUS
} = require("../../../shared/constants/user-status.constant");
const Device = require("../../devices/models/Device");
const authService = require("../services/auth.service");

class AuthController {

    register = async(req, res) => {
        const {
            name,
            email,
            phone,
            password
        } = req.body;
        const data = {
            name,
            email,
            phone,
            password
        }
        const userObj = await authService.register(data)

        return successResponse(res, 201, "تم انشاء الحساب بنجاح", userObj);



    }

    login = async(req, res) => {

        const {
            email,
            password
        } = req.body;

        //logic user
        let user = await authService.login(email, password);

        const deviceData = {
            deviceId: req.headers["x-device-id"],
            deviceType: req.body.deviceType || "web",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        };

        const device = await deviceService.registerOrUpdateDevice(user._id, deviceData);
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
            deviceId: device.deviceId

        };
        const accessToken = jwtService.genrateAccessToken(payload);
        const refreshToken = jwtService.genrateRefreshToken(payload);

        cookiesService.setAccessToken(res, accessToken);
        cookiesService.setRefreshToken(res, refreshToken);

        const userObj = user.toObject();
        delete userObj.password;

        return successResponse(res, 201, "تم تسجيل الدخول  بنجاح", {
            userObj: userObj,
            deviceId: device.deviceId
        });


    }

    logout = async(req, res) => {
        cookiesService.clearTokens(res);
        return res.status(200).json({
            msg: "تم تسجيل الخروج بنجاح"
        });
    }

    refreshToken = async(req, res) => {
            const oldRefreshToken = cookiesService.getRefreshToken(req);

            const {
                accessToken,
                newRefreshToken
            } = await authService.refreshAuthTokens(oldRefreshToken);

            cookiesService.setAccessToken(res, accessToken);
            cookiesService.setRefreshToken(res, newRefreshToken);

            return successResponse(res, 200, "تم تجديد التوكين بنجاح");

        }
        //change my password 
    changeMyPassword = async(req, res) => {
        const {
            oldPassword,
            newPassword
        } = req.body;
        const userId = req._user.id;

        await authService.changePassword(userId, oldPassword, newPassword);

        return successResponse(res, 200, "تم تغيير كلمة المرور بنجاح");
    };
    //=========================

}



module.exports = new AuthController();
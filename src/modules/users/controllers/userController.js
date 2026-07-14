const asyncHandler = require('../../../utils/asyncHandler');
const {
    successResponse,
    errorResponse
} = require('../../../shared/helpers/api-response.helper');
const userService = require('../services/user.service');
const User = require('../models/User');

class UserController {
    getAll = asyncHandler(async (req, res) => {
        const users = await userService.getAll();
        return successResponse(res, 200, 'تم جلب المستخدمين', users);
    });

    getById = asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id);
        return successResponse(res, 200, 'تم جلب المستخدم', user);
    });



    //==============================
    //profile 
    getMyProfile = async (req, res) => {
        const userId = req._user.id;

        const user = await User.findById(userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "المستخدم غير موجود"
            });
        }

        return res.status(200).json({
            message: "بيانات الحساب",
            user
        });

    }
    //===============
    updateMyProfile = async (req, res) => {

        const userId = req._user.id;

        const {
            name,
            phone
        } = req.body;


        const user = await User.findById(userId);


        if (!user) {
            return res.status(404).json({
                message: "المستخدم غير موجود"
            });
        }


        user.name = name || user.name;
        user.phone = phone || user.phone;


        await user.save();


        const userData = user.toObject();
        delete userData.password;


        return res.status(200).json({
            message: "تم تحديث البيانات بنجاح",
            user: userData
        });
    };
}

module.exports = new UserController();
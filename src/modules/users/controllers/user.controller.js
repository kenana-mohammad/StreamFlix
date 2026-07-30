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

        const user = await userService.getMyProfile(userId);
        return successResponse(res, 200, 'عرض الملف الشخصي', user);


    }
    //===============
    updateMyProfile = async (req, res) => {

        const userId = req._user.id;

        const {
            name,
            phone
        } = req.body;

        const user = await userService.updateMyProfile(userId, name,
            phone);

        return successResponse(res, 201, 'تم تحديث البيانات بنجاح', user);



    };
}

module.exports = new UserController();
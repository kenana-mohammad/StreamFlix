const asyncHandler = require('../../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../../shared/helpers/api-response.helper');
const userService = require('../services/user.service');

class UserController {
    getAll = asyncHandler(async (req, res) => {
        const users = await userService.getAll();
        return successResponse(res, 200, 'تم جلب المستخدمين', users);
    });

    getById = asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id);
        return successResponse(res, 200, 'تم جلب المستخدم', user);
    });

    create = asyncHandler(async (req, res) => {
        const user = await userService.create(req.body);
        return successResponse(res, 201, 'تم إنشاء المستخدم', user);
    });

    update = asyncHandler(async (req, res) => {
        const user = await userService.update(req.params.id, req.body);
        return successResponse(res, 200, 'تم تحديث المستخدم', user);
    });

    remove = asyncHandler(async (req, res) => {
        await userService.remove(req.params.id);
        return successResponse(res, 200, 'تم حذف المستخدم');
    });

    // فشل متوقع داخل Controller → errorResponse مباشرة
    exampleManualError = asyncHandler(async (req, res) => {
        if (!req.body.email) {
            return errorResponse(res, 400, 'البريد الإلكتروني مطلوب');
        }

        return successResponse(res, 200, 'البيانات صحيحة');
    });
}

module.exports = new UserController();

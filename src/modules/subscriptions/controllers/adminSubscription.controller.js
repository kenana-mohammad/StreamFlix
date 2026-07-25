const { successResponse } = require("../../../shared/helpers/api-response.helper");
const Subscription = require("../models/Subscription");
const adminSubscriptionService = require("../services/adminSubscription.service");

class AdminSubscriptionController {
    getSubscriptions = async(req, res) => {
        const { status } = req.query;

        // استدعاء البيانات من السيرفس
        const subscriptions = await adminSubscriptionService.getSubscriptions(status);

        return successResponse(
            res,
            200,
            "عرض الاشتراكات بنجاح",
            subscriptions
        );
    }

    getSubscriptionDetails = async(req, res) => {
        const id = req.params.id;

        const result = await adminSubscriptionService.getSubscriptionDetails(id);

        return successResponse(res, 200,
            "عرض تفاصيل الاشتراك", result);
    }

    getAdminStats = async(req, res) => {
        const result = await adminSubscriptionService.getAdminStats();

        return successResponse(res, 200, "تم جلب إحصائيات الاشتراكات بنجاح", result);
    }
}
module.exports = new AdminSubscriptionController()
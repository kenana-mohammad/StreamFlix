const {
    errorResponse
} = require("../shared/helpers/api-response.helper");

const errorHandler = (err, req, res, next) => {
    // 1. تحديد الـ status code (الافتراضي 500 إذا لم يوجد)
    const statusCode = err.statusCode || 500;

    // 2. تحديد الرسالة (الافتراضية للخطأ أو رسالة مخصصة)
    const message = err.message || "حدث خطأ غير متوقع";

    // 3. إرسال الرد باستخدام الـ helper الخاص بك
    // نمرر null في المكان الثالث لأننا نكتفي بالرسالة، أو يمكنك تمرير err.errors إذا كنت تستخدم validate
    return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;
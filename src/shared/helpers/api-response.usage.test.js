/**
 * ============================================================
 *  دليل استخدام apiResponse + asyncHandler + errorHandler
 * ============================================================
 *
 *  كيف تعرف إن الطلب نجح أو فشل؟
 *  --------------------------------
 *  افحص دائمًا الحقل: success
 *
 *  نجاح  → { success: true,  message: "...", data: {...} }
 *  فشل   → { success: false, message: "...", errors?: [...] }
 *
 *
 *  عندك 3 طرق للتعامل مع الأخطاء:
 *  --------------------------------
 *
 *  1) successResponse  → للنجاح فقط
 *     Controller:
 *       return successResponse(res, 200, 'تم بنجاح', data);
 *
 *  2) errorResponse    → فشل متوقع (أنت تعرف السبب)
 *     Controller:
 *       return errorResponse(res, 400, 'بيانات غير صالحة');
 *     ملاحظة: لا ترمي throw هنا، أرجع الرد مباشرة.
 *
 *  3) throw AppError   → فشل من الـ Service
 *     Service:
 *       throw new AppError('غير موجود', 404);
 *     التدفق:
 *       throw → asyncHandler يلتقطه → next(err) → errorHandler يرد
 *
 *
 *  دور كل جزء:
 *  ------------
 *  asyncHandler  → يلف دالة الـ Controller ويمرر أي خطأ لـ next()
 *  errorHandler  → يرد بصيغة موحدة عندما يصله err
 *  AppError      → خطأ متوقع مع statusCode (404, 400, 403...)
 *
 *
 *  مثال تدفق ناجح:
 *  ----------------
 *  Request → Controller → Service → DB
 *                ↓
 *         successResponse(res, 200, '...', data)
 *                ↓
 *  Response: { success: true, message: "...", data: {...} }
 *
 *
 *  مثال تدفق فاشل (throw):
 *  ------------------------
 *  Request → Controller → Service
 *                            ↓
 *                     throw new AppError('غير موجود', 404)
 *                            ↓
 *                     asyncHandler → next(err)
 *                            ↓
 *                     errorHandler
 *                            ↓
 *  Response: { success: false, message: "غير موجود" }
 *
 *
 *  مثال تدفق فاشل (errorResponse مباشرة):
 *  ---------------------------------------
 *  Request → Controller
 *                ↓
 *         if (!email) return errorResponse(res, 400, '...');
 *                ↓
 *  Response: { success: false, message: "..." }
 *
 *
 *  في الـ Frontend:
 *  ----------------
 *  const res = await fetch('/api/users');
 *  const json = await res.json();
 *
 *  if (json.success) {
 *      // نجاح → استخدم json.data
 *  } else {
 *      // فشل → اعرض json.message
 *  }
 *
 *
 *  قاعدة بسيطة:
 *  -------------
 *  - خطأ تعرفه مسبقًا في Controller  → errorResponse
 *  - خطأ من Business Logic في Service → throw AppError
 *  - خطأ غير متوقع (DB crash...)      → يصل لـ errorHandler تلقائيًا
 */

const AppError = require('../errors/AppError');
const { successResponse, errorResponse } = require('./api-response.helper');

// ─── أمثلة شكل الردود (للمرجع فقط) ───

const exampleSuccessShape = {
    success: true,
    message: 'تم جلب المستخدمين',
    data: [{ _id: '...', name: 'Ali' }]
};

const exampleErrorShape = {
    success: false,
    message: 'المستخدم غير موجود'
};

const exampleValidationErrorShape = {
    success: false,
    message: 'Validation failed',
    errors: [
        { field: 'email', message: 'البريد مطلوب', value: undefined }
    ]
};

// ─── محاكاة بسيطة بدون Express (للتجربة: node src/shared/helpers/api-response.usage.test.js) ───

const mockRes = () => {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
    return res;
};

const runExamples = () => {
    const res1 = mockRes();
    successResponse(res1, 200, 'تم', { id: 1 });
    console.log('✅ نجاح:', res1.statusCode, res1.body);

    const res2 = mockRes();
    errorResponse(res2, 400, 'بيانات ناقصة');
    console.log('❌ فشل (errorResponse):', res2.statusCode, res2.body);

    const err = new AppError('غير موجود', 404);
    console.log('❌ فشل (AppError للـ errorHandler):', {
        statusCode: err.statusCode,
        message: err.message,
        isOperational: err.isOperational
    });

    console.log('\n--- أشكال الردود المتوقعة ---');
    console.log('نجاح:', JSON.stringify(exampleSuccessShape, null, 2));
    console.log('فشل:', JSON.stringify(exampleErrorShape, null, 2));
    console.log('فشل تحقق:', JSON.stringify(exampleValidationErrorShape, null, 2));
};

if (require.main === module) {
    runExamples();
}

module.exports = {
    exampleSuccessShape,
    exampleErrorShape,
    exampleValidationErrorShape,
    runExamples
};

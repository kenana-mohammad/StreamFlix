const asyncHandler = require('../../utils/asyncHandler');
const {
    successResponse,
    errorResponse
} = require('../helpers/api-response.helper');
const errorHandler = require('../../middlewares/errorHandler');

// ─────────────────────────────────────────
// 1) بيانات وهمية (بدل DB)
// ─────────────────────────────────────────
const mockCasts = [{
        _id: 'cast_1',
        name: 'Leonardo DiCaprio',
        image: 'https://example.com/leo.jpg',
        biography: 'American actor and film producer.'
    },
    {
        _id: 'cast_2',
        name: 'Tom Hanks',
        image: 'https://example.com/tom.jpg',
        biography: 'American actor and filmmaker.'
    }
];

// ─────────────────────────────────────────
// 2) Service — Business Logic هنا
// ─────────────────────────────────────────
class CastService {
    async getAll() {
        return mockCasts;
    }

    async getById(id) {
        const cast = mockCasts.find((item) => item._id === id);

        if (!cast) {
            // خطأ متوقع → يرمى ويصل لـ errorHandler عبر asyncHandler
            const err = new Error('الممثل غير موجود');
            throw err;
        }

        return cast;
    }

    async searchByName(name) {
        if (!name || name.trim() === '') {
            // يمكن أيضًا throw، لكن هنا نرجع null والـ Controller يقرر
            return null;
        }

        return mockCasts.filter((item) =>
            item.name.toLowerCase().includes(name.toLowerCase())
        );
    }
}

const castService = new CastService();

// ─────────────────────────────────────────
// 3) Controller — يستقبل req/res ويرد للعميل
// ─────────────────────────────────────────
class CastController {
    // GET /api/casts
    getAll = asyncHandler(async (req, res) => {
        const casts = await castService.getAll();
        return successResponse(res, 200, 'تم جلب الممثلين', casts);
    });

    // GET /api/casts/:id
    getById = asyncHandler(async (req, res) => {
        const cast = await castService.getById(req.params.id);
        return successResponse(res, 200, 'تم جلب الممثل', cast);
    });

    // GET /api/casts/search?name=...
    search = asyncHandler(async (req, res) => {
        const {
            name
        } = req.query;

        // فشل متوقع → errorResponse مباشرة (بدون throw)
        if (!name) {
            return errorResponse(res, 400, 'اسم البحث مطلوب');
        }

        const results = await castService.searchByName(name);

        if (!results) {
            return errorResponse(res, 400, 'اسم البحث غير صالح');
        }

        return successResponse(res, 200, 'نتائج البحث', results);
    });
}

const castController = new CastController();

// ─────────────────────────────────────────
// 4) أدوات محاكاة Express (للتجربة فقط)
// ─────────────────────────────────────────
const createMockRes = () => {
    let resolveJson;

    const jsonPromise = new Promise((resolve) => {
        resolveJson = resolve;
    });

    const res = {
        statusCode: 200,
        body: null,
        jsonPromise,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            resolveJson();
            return this;
        }
    };

    return res;
};

const runAction = async (label, handler, req) => {
    const res = createMockRes();

    const errorPromise = new Promise((resolve) => {
        handler(req, res, (err) => {
            if (err) {
                errorHandler(err, req, res, () => {});
            }
            resolve();
        });
    });

    // ننتظر حتى يُرسل الرد (نجاح أو فشل)
    await Promise.race([res.jsonPromise, errorPromise]);

    console.log(`\n${'='.repeat(55)}`);
    console.log(`📌 ${label}`);
    console.log(`${'='.repeat(55)}`);
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(res.body, null, 2));

    // كيف الفريق يعرف نجاح أو فشل؟
    if (res.body.success === true) {
        console.log('✅ النتيجة: نجاح (من successResponse)');
    } else if (res.body.success === false) {
        console.log('❌ النتيجة: فشل متوقع (من errorResponse)');
    } else if (res.body.error === 'error') {
        console.log('❌ النتيجة: فشل (من errorHandler بعد throw)');
        console.log('   الرسالة:', res.body.msg);
    }
};

// ─────────────────────────────────────────
// 5) تشغيل السيناريوهات
// ─────────────────────────────────────────
const runExamples = async () => {
    console.log('\n🎬 Cast API Pattern — مثال للفريق\n');

    // سيناريو 1: جلب كل الممثلين (نجاح)
    await runAction(
        'GET /api/casts — جلب كل الممثلين',
        castController.getAll, {
            params: {},
            query: {},
            body: {}
        }
    );

    // سيناريو 2: جلب ممثل موجود (نجاح)
    await runAction(
        'GET /api/casts/cast_1 — ممثل موجود',
        castController.getById, {
            params: {
                id: 'cast_1'
            },
            query: {},
            body: {}
        }
    );

    await runAction(
        'GET /api/casts/xxx — ممثل غير موجود',
        castController.getById, {
            params: {
                id: 'xxx'
            },
            query: {},
            body: {}
        }
    );

    await runAction(
        'GET /api/casts/search — بدون اسم',
        castController.search, {
            params: {},
            query: {},
            body: {}
        }
    );

    // سيناريو 5: بحث ناجح (نجاح)
    await runAction(
        'GET /api/casts/search?name=Tom — بحث ناجح',
        castController.search, {
            params: {},
            query: {
                name: 'Tom'
            },
            body: {}
        }
    );

    console.log(`\n${'='.repeat(55)}`);
    console.log('📚 ملخص سريع للفريق');
    console.log(`${'='.repeat(55)}`);
    console.log(`
Controller  → يستقبل الطلب ويرد للعميل
Service     → فيه المنطق (جلب، بحث، تحقق...)
successResponse → نجاح: { success: true, message, data }
errorResponse   → فشل متوقع: { success: false, message }
throw + errorHandler → فشل من Service: { msg, error: "error" }
asyncHandler    → يلتقط أي throw ويمرره لـ errorHandler
`);
};

if (require.main === module) {
    runExamples();
}

module.exports = {
    CastService,
    CastController,
    runExamples
};
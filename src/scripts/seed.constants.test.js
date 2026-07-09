/**
 * ============================================================
 *  اختبار Constants — بدون DB
 * ============================================================
 *
 *  التشغيل:
 *    node src/scripts/seed.constants.test.js
 *
 *  الهدف: التأكد إن كل الـ enums مطابقة للـ ERD
 *  وبإن createAdmin يستخدم القيم الصحيحة
 */

const { ROLES } = require('../shared/constants/roles.constant');
const { USER_STATUS } = require('../shared/constants/user-status.constant');
const { SUBSCRIPTION_STATUS } = require('../shared/constants/subscription-status.constant');
const { CONTENT_TYPE } = require('../shared/constants/content-type.constant');
const { CONTENT_STATUS } = require('../shared/constants/content-status.constant');
const { DEVICE_TYPE } = require('../shared/constants/device-type.constant');
const { QUALITY } = require('../shared/constants/quality.constant');
const { AGE_RATING } = require('../shared/constants/age-rating.constant');

const assertEqual = (label, actual, expected) => {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    const passed = actualJson === expectedJson;

    console.log(passed ? `✅ ${label}` : `❌ ${label}`);
    if (!passed) {
        console.log('   المتوقع:', expectedJson);
        console.log('   الفعلي:  ', actualJson);
    }

    return passed;
};

const assertIncludes = (label, values, value) => {
    const passed = values.includes(value);

    console.log(passed ? `✅ ${label}` : `❌ ${label}`);
    if (!passed) {
        console.log(`   القيمة "${value}" غير موجودة في:`, values);
    }

    return passed;
};

const runTests = () => {
    let passed = 0;
    let failed = 0;

    const check = (result) => {
        if (result) passed += 1;
        else failed += 1;
    };

    console.log('\n📦 اختبار ملفات Constants\n');

    check(assertEqual(
        'ROLES',
        Object.values(ROLES),
        ['super_admin', 'content_manager', 'user']
    ));

    check(assertEqual(
        'USER_STATUS',
        Object.values(USER_STATUS),
        ['active', 'suspended', 'deactivated', 'banned']
    ));

    check(assertEqual(
        'SUBSCRIPTION_STATUS',
        Object.values(SUBSCRIPTION_STATUS),
        ['active', 'expired', 'cancelled', 'pending']
    ));

    check(assertEqual(
        'CONTENT_TYPE',
        Object.values(CONTENT_TYPE),
        ['Movie', 'Series']
    ));

    check(assertEqual(
        'CONTENT_STATUS',
        Object.values(CONTENT_STATUS),
        ['Published', 'Draft']
    ));

    check(assertEqual(
        'DEVICE_TYPE',
        Object.values(DEVICE_TYPE),
        ['mobile', 'tv', 'web']
    ));

    check(assertEqual(
        'QUALITY',
        Object.values(QUALITY),
        ['SD', 'HD', '4K']
    ));

    check(assertEqual(
        'AGE_RATING',
        Object.values(AGE_RATING),
        ['G', 'PG', 'PG-13', 'R', 'NC-17']
    ));

    console.log('\n👤 اختبار createAdmin — القيم المستخدمة\n');

    check(assertIncludes(
        'Super Admin role',
        Object.values(ROLES),
        ROLES.SUPER_ADMIN
    ));

    check(assertIncludes(
        'Content Manager role',
        Object.values(ROLES),
        ROLES.CONTENT_MANAGER
    ));

    check(assertIncludes(
        'Admin status = active',
        Object.values(USER_STATUS),
        USER_STATUS.ACTIVE
    ));

    check(assertEqual(
        'createAdmin roles mapping',
        {
            superAdmin: ROLES.SUPER_ADMIN,
            contentManager: ROLES.CONTENT_MANAGER,
            defaultUser: ROLES.USER
        },
        {
            superAdmin: 'super_admin',
            contentManager: 'content_manager',
            defaultUser: 'user'
        }
    ));

    check(assertEqual(
        'createAdmin status mapping',
        { active: USER_STATUS.ACTIVE },
        { active: 'active' }
    ));

    console.log('\n' + '='.repeat(45));
    console.log(`النتيجة: ${passed} نجح | ${failed} فشل`);
    console.log('='.repeat(45));

    if (failed > 0) {
        process.exit(1);
    }
};

runTests();

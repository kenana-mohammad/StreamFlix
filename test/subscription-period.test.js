const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");

delete process.env.USE_TRANSACTIONS;

const cron = require("node-cron");
const Payment = require("../src/modules/Payment/model/Payment");
const Plan = require("../src/modules/plans/models/Plan");
const Subscription = require("../src/modules/subscriptions/models/Subscription");
const subscriptionService = require("../src/modules/subscriptions/services/subscription.service");
const { SUBSCRIPTION_STATUS } = require("../src/shared/constants/subscription-status.constant");

const originalMethods = {
    cronSchedule: cron.schedule,
    paymentCreate: Payment.create,
    paymentFindById: Payment.findById,
    paymentFindOne: Payment.findOne,
    planFindById: Plan.findById,
    subscriptionCreate: Subscription.create,
    subscriptionFind: Subscription.find,
    subscriptionFindOne: Subscription.findOne,
    subscriptionFindOneAndUpdate: Subscription.findOneAndUpdate,
    subscriptionUpdateMany: Subscription.updateMany,
    subscriptionUpdateOne: Subscription.updateOne,
    renewExpiredAutomatic: subscriptionService.renewExpiredAutomatic
};

afterEach(() => {
    cron.schedule = originalMethods.cronSchedule;
    Payment.create = originalMethods.paymentCreate;
    Payment.findById = originalMethods.paymentFindById;
    Payment.findOne = originalMethods.paymentFindOne;
    Plan.findById = originalMethods.planFindById;
    Subscription.create = originalMethods.subscriptionCreate;
    Subscription.find = originalMethods.subscriptionFind;
    Subscription.findOne = originalMethods.subscriptionFindOne;
    Subscription.findOneAndUpdate = originalMethods.subscriptionFindOneAndUpdate;
    Subscription.updateMany = originalMethods.subscriptionUpdateMany;
    Subscription.updateOne = originalMethods.subscriptionUpdateOne;
    subscriptionService.renewExpiredAutomatic =
        originalMethods.renewExpiredAutomatic;
    delete require.cache[require.resolve("../src/scheduler/subscriptionScheduler")];
});

const makeQuery = (result, capture = {}) => ({
    populate(value) {
        capture.populate = value;
        return this;
    },
    session(value) {
        capture.session = value;
        return this;
    },
    sort(value) {
        capture.sort = value;
        return this;
    },
    select(value) {
        capture.select = value;
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
    }
});

const makePopulateQuery = (result) => ({
    populate() {
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
    }
});

test("manual renewal rejects before the current paid period ends without resetting usage", {
    concurrency: false
}, async() => {
    const subscription = {
        _id: "subscription-a",
        userId: "user-a",
        planId: "plan-a",
        endDate: new Date(Date.now() + 60 * 60 * 1000),
        usage: { movies: 8, series: 4 },
        consumedViewKeys: ["profile-a:content-a"]
    };
    let updateCalls = 0;

    Subscription.findOne = () => makeQuery(subscription);
    Subscription.updateMany = async() => {
        updateCalls += 1;
    };

    await assert.rejects(
        () => subscriptionService.renewManual({
            subscriptionId: subscription._id,
            userId: subscription.userId,
            paymentMethod: "visa",
            currency: "USD"
        }),
        (error) => {
            assert.equal(error.statusCode, 409);
            assert.match(error.message, /قبل انتهاء فترة الاشتراك الحالية/);
            return true;
        }
    );

    assert.equal(updateCalls, 0);
    assert.deepEqual(subscription.usage, { movies: 8, series: 4 });
    assert.deepEqual(subscription.consumedViewKeys, ["profile-a:content-a"]);
});

test("manual renewal starts an elapsed subscription from now and resets period usage", {
    concurrency: false
}, async() => {
    const subscription = {
        _id: "subscription-a",
        userId: "user-a",
        planId: "plan-a",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date(Date.now() - 60 * 1000),
        status: SUBSCRIPTION_STATUS.EXPIRED,
        autoRenew: false,
        usage: { movies: 8, series: 4 },
        consumedViewKeys: ["profile-a:content-a"]
    };
    const plan = {
        _id: "plan-a",
        duration: 30,
        price: 12
    };
    const findFilters = [];
    let updateFilter;
    let renewalFilter;
    let renewalUpdate;
    let renewalOptions;
    const originalStartDate = subscription.startDate;
    const originalEndDate = subscription.endDate;

    Subscription.findOne = (filter) => {
        findFilters.push(filter);
        return makeQuery(findFilters.length === 1 ? subscription : null);
    };
    Subscription.updateMany = async(filter) => {
        updateFilter = filter;
        return { modifiedCount: 0 };
    };
    Plan.findById = () => makeQuery(plan);
    Subscription.findOneAndUpdate = async(filter, update, options) => {
        renewalFilter = filter;
        renewalUpdate = update;
        renewalOptions = options;
        Object.assign(subscription, update.$set);
        return subscription;
    };
    Payment.create = async() => [{ _id: "payment-a" }];
    Payment.findById = () => makePopulateQuery({ _id: "payment-a" });

    const beforeRenewal = Date.now();
    await subscriptionService.renewManual({
        subscriptionId: subscription._id,
        userId: subscription.userId,
        paymentMethod: "visa",
        currency: "USD",
        autoRenew: true
    });
    const afterRenewal = Date.now();

    assert.equal(subscription.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.equal(subscription.autoRenew, true);
    assert.deepEqual(subscription.usage, { movies: 0, series: 0 });
    assert.deepEqual(subscription.consumedViewKeys, []);
    assert.ok(subscription.startDate.getTime() >= beforeRenewal);
    assert.ok(subscription.startDate.getTime() <= afterRenewal);
    assert.equal(
        subscription.endDate.getTime(),
        new Date(subscription.startDate).setDate(subscription.startDate.getDate() + plan.duration)
    );
    assert.deepEqual(updateFilter, {
        _id: { $ne: subscription._id },
        userId: subscription.userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: { $lte: subscription.startDate }
    });
    assert.deepEqual(findFilters[1], {
        _id: { $ne: subscription._id },
        userId: subscription.userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: { $gt: subscription.startDate }
    });
    assert.deepEqual(renewalFilter, {
        _id: subscription._id,
        userId: subscription.userId,
        status: SUBSCRIPTION_STATUS.EXPIRED,
        startDate: originalStartDate,
        endDate: originalEndDate
    });
    assert.equal(renewalUpdate.$set.startDate, subscription.startDate);
    assert.equal(renewalUpdate.$set.endDate, subscription.endDate);
    assert.deepEqual(renewalOptions, { new: true });
});

test("subscription creation expires stale active rows before activating a new subscription", {
    concurrency: false
}, async() => {
    const plan = {
        _id: "plan-a",
        duration: 30,
        price: 12
    };
    const subscription = {
        _id: "subscription-new",
        status: SUBSCRIPTION_STATUS.PENDING,
        async save() {
            this.saved = true;
        }
    };
    let staleUpdateFilter;
    let staleUpdate;
    let activeLookupFilter;

    Subscription.updateMany = async(filter, update) => {
        staleUpdateFilter = filter;
        staleUpdate = update;
        return { modifiedCount: 1 };
    };
    Subscription.findOne = (filter) => {
        activeLookupFilter = filter;
        return makeQuery(null);
    };
    Subscription.create = async() => [subscription];
    Payment.create = async() => [{ _id: "payment-a" }];
    Payment.findById = () => makePopulateQuery({ _id: "payment-a" });

    await subscriptionService.createSubscription({
        userId: "user-a",
        plan,
        paymentMethod: "visa",
        currency: "USD"
    });

    assert.equal(subscription.saved, true);
    assert.equal(subscription.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.equal(staleUpdateFilter.userId, "user-a");
    assert.equal(staleUpdateFilter.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.ok(staleUpdateFilter.endDate.$lte instanceof Date);
    assert.deepEqual(staleUpdate, {
        $set: {
            status: SUBSCRIPTION_STATUS.EXPIRED,
            autoRenew: false
        }
    });
    assert.equal(activeLookupFilter.userId, "user-a");
    assert.equal(activeLookupFilter.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.strictEqual(
        activeLookupFilter.endDate.$gt,
        staleUpdateFilter.endDate.$lte
    );
});

test("scheduler selects auto-renewals only at expiration and expires nonrenewed rows afterward", {
    concurrency: false
}, async() => {
    let expression;
    let scheduledJob;
    let renewalFilter;
    let expiryFilter;
    let expiryUpdate;
    const renewalCalls = [];
    const elapsedEndDate = new Date(Date.now() - 1000);

    cron.schedule = (value, job) => {
        expression = value;
        scheduledJob = job;
    };
    Subscription.find = (filter) => {
        renewalFilter = filter;
        return makeQuery([{
            _id: "subscription-a",
            endDate: elapsedEndDate
        }]);
    };
    subscriptionService.renewExpiredAutomatic = async(data) => {
        renewalCalls.push(data);
        return { renewed: true };
    };
    Subscription.updateMany = async(filter, update) => {
        expiryFilter = filter;
        expiryUpdate = update;
        return { modifiedCount: 0 };
    };

    const scheduler = require("../src/scheduler/subscriptionScheduler");
    scheduler.init();
    await scheduledJob();

    assert.equal(expression, "* * * * *");
    assert.equal(renewalFilter.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.equal(renewalFilter.autoRenew, true);
    assert.ok(renewalFilter.endDate.$lte instanceof Date);
    assert.equal(Object.hasOwn(renewalFilter.endDate, "$gte"), false);
    assert.deepEqual(renewalCalls, [{
        subscriptionId: "subscription-a",
        expectedEndDate: elapsedEndDate
    }]);
    assert.deepEqual(expiryFilter.status.$in, [
        SUBSCRIPTION_STATUS.ACTIVE,
        SUBSCRIPTION_STATUS.PENDING
    ]);
    assert.strictEqual(expiryFilter.endDate.$lte, renewalFilter.endDate.$lte);
    assert.deepEqual(expiryUpdate, {
        $set: {
            status: SUBSCRIPTION_STATUS.EXPIRED,
            autoRenew: false
        }
    });
});

const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");

const subscriptionService = require("../src/modules/subscriptions/services/subscription.service");
const Subscription = require("../src/modules/subscriptions/models/Subscription");
const SubscriptionUsage = require("../src/modules/subscriptions/models/SubscriptionUsage");
const { CONTENT_TYPE } = require("../src/shared/constants/content-type.constant");
const { SUBSCRIPTION_STATUS } = require("../src/shared/constants/subscription-status.constant");

const originalMethods = {
    subscriptionFind: Subscription.find,
    subscriptionFindOneAndUpdate: Subscription.findOneAndUpdate,
    subscriptionUpdateOne: Subscription.updateOne,
    usageFindOne: SubscriptionUsage.findOne,
    usageCreate: SubscriptionUsage.create,
    usageCountDocuments: SubscriptionUsage.countDocuments,
    usageDeleteOne: SubscriptionUsage.deleteOne
};

afterEach(() => {
    Subscription.find = originalMethods.subscriptionFind;
    Subscription.findOneAndUpdate = originalMethods.subscriptionFindOneAndUpdate;
    Subscription.updateOne = originalMethods.subscriptionUpdateOne;
    SubscriptionUsage.findOne = originalMethods.usageFindOne;
    SubscriptionUsage.create = originalMethods.usageCreate;
    SubscriptionUsage.countDocuments = originalMethods.usageCountDocuments;
    SubscriptionUsage.deleteOne = originalMethods.usageDeleteOne;
});

const makeQuery = (result, state = {}) => ({
    sort(value) {
        state.sort = value;
        return this;
    },
    limit(value) {
        state.limit = value;
        return this;
    },
    populate(value) {
        state.populate = value;
        return this;
    },
    select(value) {
        state.select = value;
        return this;
    },
    session(value) {
        state.session = value;
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
    }
});

const makeSubscription = (overrides = {}) => {
    const {
        planId = {},
        usage = {},
        consumedViewKeys = [],
        ...subscriptionOverrides
    } = overrides;

    return {
        _id: "subscription-a",
        userId: "user-a",
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        status: SUBSCRIPTION_STATUS.ACTIVE,
        ...subscriptionOverrides,
        planId: {
            _id: "plan-a",
            isLimited: true,
            maxMovies: 10,
            maxSeries: 5,
            ...planId
        },
        usage: {
            movies: 0,
            series: 0,
            ...usage
        },
        consumedViewKeys: [...consumedViewKeys]
    };
};

const stubFind = (resultFactory, capture = {}) => {
    capture.findFilters = capture.findFilters || [];
    capture.queryStates = capture.queryStates || [];
    capture.usageFindFilters = capture.usageFindFilters || [];
    capture.subscriptionUpdateCalls = capture.subscriptionUpdateCalls || [];

    Subscription.find = (filter) => {
        capture.findFilters.push(filter);
        const queryState = {};
        capture.queryStates.push(queryState);
        const result = typeof resultFactory === "function" ?
            resultFactory(filter) :
            resultFactory;

        return makeQuery(result, queryState);
    };

    SubscriptionUsage.findOne = (filter) => {
        capture.usageFindFilters.push(filter);
        return makeQuery(null);
    };

    Subscription.updateOne = async(filter, update, options) => {
        capture.subscriptionUpdateCalls.push({ filter, update, options });

        const subscriptions = Array.isArray(resultFactory) ?
            resultFactory :
            [];
        const subscription = subscriptions.find(
            (item) => String(item._id) === String(filter._id)
        );
        const consumptionKey = update.$pull?.consumedViewKeys;

        if (subscription && consumptionKey) {
            subscription.consumedViewKeys = subscription.consumedViewKeys.filter(
                (key) => key !== consumptionKey
            );
        }

        return { modifiedCount: subscription ? 1 : 0 };
    };

    return capture;
};

const installInMemoryUsageStore = (subscriptionsByUser, capture = {}) => {
    capture.findFilters = [];
    capture.updateFilters = [];
    capture.subscriptionUpdateCalls = [];
    capture.ledgerFindFilters = [];
    capture.ledgerEntries = [];

    Subscription.find = (filter) => {
        capture.findFilters.push(filter);
        return makeQuery(subscriptionsByUser.get(String(filter.userId)) || []);
    };

    Subscription.findOneAndUpdate = async(filter, update) => {
        capture.updateFilters.push(filter);
        const subscriptions = subscriptionsByUser.get(String(filter.userId)) || [];
        const subscription = subscriptions.find((item) => String(item._id) === String(filter._id));

        if (!subscription) {
            return null;
        }

        const consumptionKey = update.$addToSet.consumedViewKeys;
        if (subscription.consumedViewKeys.includes(consumptionKey)) {
            return null;
        }

        subscription.consumedViewKeys.push(consumptionKey);
        const [[usagePath, increment]] = Object.entries(update.$inc);
        const usageKey = usagePath.split(".")[1];
        subscription.usage[usageKey] += increment;

        return subscription;
    };

    Subscription.updateOne = async(filter, update, options) => {
        capture.subscriptionUpdateCalls.push({ filter, update, options });
        const subscriptions = subscriptionsByUser.get(String(filter.userId)) || [];
        const subscription = subscriptions.find(
            (item) => String(item._id) === String(filter._id)
        );
        const consumptionKey = update.$pull?.consumedViewKeys;

        if (!subscription || !consumptionKey) {
            return { modifiedCount: 0 };
        }

        subscription.consumedViewKeys = subscription.consumedViewKeys.filter(
            (key) => key !== consumptionKey
        );
        return { modifiedCount: 1 };
    };

    SubscriptionUsage.findOne = (filter) => {
        capture.ledgerFindFilters.push(filter);
        const usage = capture.ledgerEntries.find((entry) => (
            String(entry.userId) === String(filter.userId) &&
            String(entry.subscriptionId) === String(filter.subscriptionId) &&
            String(entry.profileId) === String(filter.profileId) &&
            String(entry.contentId) === String(filter.contentId) &&
            entry.periodStart.getTime() === filter.periodStart.getTime()
        ));

        return makeQuery(usage || null);
    };

    SubscriptionUsage.create = async(entries) => {
        capture.ledgerEntries.push(...entries);
        return entries.map((entry, index) => ({
            ...entry,
            _id: `usage-${capture.ledgerEntries.length + index}`
        }));
    };

    return capture;
};

test("limited Movie view is allowed at 9/10 and advances the account counter to 10", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 9, series: 1 }
    });
    const capture = stubFind([subscription]);
    let ledgerEntry;

    Subscription.findOneAndUpdate = async(filter, update, options) => {
        capture.updateFilter = filter;
        capture.update = update;
        capture.updateOptions = options;
        subscription.usage.movies = 10;
        subscription.consumedViewKeys.push("profile-1:movie-1");
        return subscription;
    };
    SubscriptionUsage.create = async(entries, options) => {
        ledgerEntry = entries[0];
        capture.createOptions = options;
        return [{ ...ledgerEntry, _id: "usage-1" }];
    };

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.isNewUsage, true);
    assert.equal(result.newlyConsumed, true);
    assert.deepEqual(result.usage, { movies: 10, series: 1 });
    assert.equal(result.usageId, "usage-1");
    assert.equal(capture.updateFilter.userId, "user-a");
    assert.deepEqual(capture.updateFilter.$or, [
        { "usage.movies": { $lt: 10 } },
        { "usage.movies": { $exists: false } }
    ]);
    assert.deepEqual(capture.update, {
        $addToSet: { consumedViewKeys: "profile-1:movie-1" },
        $inc: { "usage.movies": 1 }
    });
    assert.equal(ledgerEntry.userId, "user-a");
    assert.equal(ledgerEntry.profileId, "profile-1");
    assert.equal(ledgerEntry.contentId, "movie-1");
    assert.equal(ledgerEntry.contentType, CONTENT_TYPE.MOVIE);
    assert.equal(ledgerEntry.periodStart.getTime(), subscription.startDate.getTime());
    assert.deepEqual(subscription.consumedViewKeys, []);
    assert.deepEqual(capture.subscriptionUpdateCalls, [{
        filter: {
            _id: "subscription-a",
            userId: "user-a",
            consumedViewKeys: "profile-1:movie-1"
        },
        update: {
            $pull: {
                consumedViewKeys: "profile-1:movie-1"
            }
        },
        options: {}
    }]);
});

test("exhausted Movie allowance rejects a new view without creating usage", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 10, series: 0 }
    });
    const capture = stubFind([subscription]);
    let ledgerCreateCalls = 0;

    Subscription.findOneAndUpdate = async(filter) => {
        capture.updateFilter = filter;
        return null;
    };
    SubscriptionUsage.create = async() => {
        ledgerCreateCalls += 1;
        return [];
    };

    await assert.rejects(
        () => subscriptionService.consumeViewAllowance({
            userId: "user-a",
            profileId: "profile-1",
            contentId: "movie-2",
            contentType: CONTENT_TYPE.MOVIE
        }),
        (error) => {
            assert.equal(error.statusCode, 403);
            assert.match(error.message, /Movie viewing limit has been exhausted/);
            return true;
        }
    );

    assert.equal(ledgerCreateCalls, 0);
    assert.equal(subscription.usage.movies, 10);
    assert.deepEqual(subscription.consumedViewKeys, []);
    assert.equal(capture.findFilters.length, 2);
    assert.deepEqual(capture.updateFilter.$or, [
        { "usage.movies": { $lt: 10 } },
        { "usage.movies": { $exists: false } }
    ]);
});

test("Series allowance uses its own limit and rejects the next Series at 5/5", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 10, series: 4 }
    });
    const capture = stubFind([subscription]);
    let ledgerCreateCalls = 0;

    Subscription.findOneAndUpdate = async(filter, update) => {
        capture.updateFilters = capture.updateFilters || [];
        capture.updateFilters.push(filter);

        if (subscription.usage.series >= 5) {
            return null;
        }

        subscription.usage.series += update.$inc["usage.series"];
        subscription.consumedViewKeys.push(update.$addToSet.consumedViewKeys);
        return subscription;
    };
    SubscriptionUsage.create = async(entries) => {
        ledgerCreateCalls += 1;
        return [{ ...entries[0], _id: "usage-series-1" }];
    };

    const allowed = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "series-1",
        contentType: CONTENT_TYPE.SERIES
    });

    assert.deepEqual(allowed.usage, { movies: 10, series: 5 });
    assert.equal(subscription.usage.movies, 10);
    assert.deepEqual(capture.updateFilters[0].$or, [
        { "usage.series": { $lt: 5 } },
        { "usage.series": { $exists: false } }
    ]);

    await assert.rejects(
        () => subscriptionService.consumeViewAllowance({
            userId: "user-a",
            profileId: "profile-1",
            contentId: "series-2",
            contentType: CONTENT_TYPE.SERIES
        }),
        (error) => {
            assert.equal(error.statusCode, 403);
            assert.match(error.message, /Series viewing limit has been exhausted/);
            return true;
        }
    );

    assert.equal(ledgerCreateCalls, 1);
    assert.equal(subscription.usage.series, 5);
});

test("duplicate profile/content consumption in the active period returns no new usage", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 3, series: 2 },
        consumedViewKeys: ["profile-1:movie-1"]
    });
    const capture = stubFind([subscription]);
    let updateCalls = 0;
    let ledgerCreateCalls = 0;

    Subscription.findOneAndUpdate = async() => {
        updateCalls += 1;
        return null;
    };
    SubscriptionUsage.create = async() => {
        ledgerCreateCalls += 1;
        return [];
    };

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.isNewUsage, false);
    assert.equal(result.newlyConsumed, false);
    assert.deepEqual(result.usage, { movies: 3, series: 2 });
    assert.equal(result.periodStart.getTime(), subscription.startDate.getTime());
    assert.equal(result.periodEnd.getTime(), subscription.endDate.getTime());
    assert.equal(updateCalls, 0);
    assert.equal(ledgerCreateCalls, 0);
    assert.equal(capture.queryStates[0].select, "+consumedViewKeys");
});

test("durable ledger duplicate returns no new usage without reserving or incrementing", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 3, series: 2 },
        consumedViewKeys: ["profile-1:movie-1"]
    });
    const capture = stubFind([subscription]);
    let reservationCalls = 0;
    let ledgerCreateCalls = 0;
    let ledgerFilter;

    SubscriptionUsage.findOne = (filter) => {
        ledgerFilter = filter;
        return makeQuery({
            _id: "usage-existing",
            ...filter,
            contentType: CONTENT_TYPE.MOVIE
        });
    };
    Subscription.findOneAndUpdate = async() => {
        reservationCalls += 1;
        return null;
    };
    SubscriptionUsage.create = async() => {
        ledgerCreateCalls += 1;
        return [];
    };

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.isNewUsage, false);
    assert.equal(result.newlyConsumed, false);
    assert.deepEqual(result.usage, { movies: 3, series: 2 });
    assert.deepEqual(ledgerFilter, {
        userId: "user-a",
        subscriptionId: "subscription-a",
        profileId: "profile-1",
        contentId: "movie-1",
        periodStart: subscription.startDate
    });
    assert.equal(reservationCalls, 0);
    assert.equal(ledgerCreateCalls, 0);
    assert.deepEqual(capture.subscriptionUpdateCalls, [{
        filter: {
            _id: "subscription-a",
            userId: "user-a",
            consumedViewKeys: "profile-1:movie-1"
        },
        update: {
            $pull: {
                consumedViewKeys: "profile-1:movie-1"
            }
        },
        options: {}
    }]);
    assert.deepEqual(subscription.consumedViewKeys, []);
});

test("duplicate ledger race reconciles the counter and clears the transient reservation", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        usage: { movies: 3, series: 2 }
    });
    const capture = stubFind([subscription]);
    const findOneAndUpdateCalls = [];
    let ledgerCountFilter;

    Subscription.findOneAndUpdate = async(filter, update, options) => {
        findOneAndUpdateCalls.push({ filter, update, options });

        if (update.$inc) {
            subscription.usage.movies += update.$inc["usage.movies"];
            subscription.consumedViewKeys.push(
                update.$addToSet.consumedViewKeys
            );
            return subscription;
        }

        subscription.usage.movies = update.$set["usage.movies"];
        subscription.consumedViewKeys = subscription.consumedViewKeys.filter(
            (key) => key !== update.$pull.consumedViewKeys
        );
        return subscription;
    };
    SubscriptionUsage.create = async() => {
        const duplicateKeyError = new Error("duplicate usage");
        duplicateKeyError.code = 11000;
        throw duplicateKeyError;
    };
    SubscriptionUsage.countDocuments = async(filter) => {
        ledgerCountFilter = filter;
        return 3;
    };

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.isNewUsage, false);
    assert.equal(result.newlyConsumed, false);
    assert.deepEqual(result.usage, { movies: 3, series: 2 });
    assert.equal(findOneAndUpdateCalls.length, 2);
    assert.deepEqual(findOneAndUpdateCalls[1], {
        filter: {
            _id: "subscription-a",
            userId: "user-a",
            status: SUBSCRIPTION_STATUS.ACTIVE,
            startDate: subscription.startDate
        },
        update: {
            $set: {
                "usage.movies": 3
            },
            $pull: {
                consumedViewKeys: "profile-1:movie-1"
            }
        },
        options: { new: true }
    });
    assert.deepEqual(ledgerCountFilter, {
        userId: "user-a",
        subscriptionId: "subscription-a",
        contentType: CONTENT_TYPE.MOVIE,
        periodStart: subscription.startDate
    });
    assert.equal(subscription.usage.movies, 3);
    assert.deepEqual(subscription.consumedViewKeys, []);
    assert.equal(capture.subscriptionUpdateCalls.length, 0);
});

test("usage is shared at account level across two profiles owned by User A", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription();
    const subscriptionsByUser = new Map([
        ["user-a", [subscription]]
    ]);
    const capture = installInMemoryUsageStore(subscriptionsByUser);

    await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        contentType: CONTENT_TYPE.MOVIE
    });
    const secondResult = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-2",
        contentId: "movie-2",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(subscription.usage.movies, 2);
    assert.equal(secondResult.usage.movies, 2);
    assert.deepEqual(subscription.consumedViewKeys, []);
    assert.equal(capture.ledgerEntries.length, 2);
    assert.deepEqual(capture.ledgerEntries.map((entry) => entry.profileId), [
        "profile-1",
        "profile-2"
    ]);
    assert.ok(capture.findFilters.every((filter) => filter.userId === "user-a"));
    assert.ok(capture.updateFilters.every((filter) => filter.userId === "user-a"));
    assert.equal(capture.subscriptionUpdateCalls.length, 2);
});

test("User B consumption is isolated and every lookup/update is scoped to User B", {
    concurrency: false
}, async() => {
    const userASubscription = makeSubscription({
        usage: { movies: 2, series: 0 },
        consumedViewKeys: ["profile-1:movie-1", "profile-2:movie-2"]
    });
    const userBSubscription = makeSubscription({
        _id: "subscription-b",
        userId: "user-b"
    });
    const subscriptionsByUser = new Map([
        ["user-a", [userASubscription]],
        ["user-b", [userBSubscription]]
    ]);
    const capture = installInMemoryUsageStore(subscriptionsByUser);

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-b",
        profileId: "profile-3",
        contentId: "movie-3",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.usage.movies, 1);
    assert.equal(userBSubscription.usage.movies, 1);
    assert.equal(userASubscription.usage.movies, 2);
    assert.deepEqual(userASubscription.consumedViewKeys, [
        "profile-1:movie-1",
        "profile-2:movie-2"
    ]);
    assert.deepEqual(userBSubscription.consumedViewKeys, []);
    assert.ok(capture.findFilters.every((filter) => filter.userId === "user-b"));
    assert.ok(capture.updateFilters.every((filter) => filter.userId === "user-b"));
    assert.deepEqual(capture.ledgerEntries.map((entry) => entry.userId), ["user-b"]);
    assert.deepEqual(capture.ledgerEntries.map((entry) => entry.profileId), ["profile-3"]);
    assert.equal(capture.subscriptionUpdateCalls.length, 1);
});

test("consumption fails when the user has no active subscription", {
    concurrency: false
}, async() => {
    stubFind([]);
    let updateCalls = 0;

    Subscription.findOneAndUpdate = async() => {
        updateCalls += 1;
        return null;
    };

    await assert.rejects(
        () => subscriptionService.consumeViewAllowance({
            userId: "user-a",
            profileId: "profile-1",
            contentId: "movie-1",
            contentType: CONTENT_TYPE.MOVIE
        }),
        (error) => {
            assert.equal(error.statusCode, 403);
            assert.equal(error.message, "No active subscription found");
            return true;
        }
    );

    assert.equal(updateCalls, 0);
});

test("multiple current active subscriptions are rejected as ambiguous", {
    concurrency: false
}, async() => {
    stubFind([
        makeSubscription({ _id: "subscription-a-1" }),
        makeSubscription({ _id: "subscription-a-2" })
    ]);

    await assert.rejects(
        () => subscriptionService.getCurrentUsage("user-a"),
        (error) => {
            assert.equal(error.statusCode, 409);
            assert.equal(error.message, "Multiple active subscriptions found for this account");
            return true;
        }
    );
});

test("active subscription lookup is user-scoped to the current start/end period", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription();
    const capture = stubFind([subscription]);
    const beforeLookup = Date.now();

    await subscriptionService.getCurrentUsage("user-a");

    const afterLookup = Date.now();
    const filter = capture.findFilters[0];
    assert.equal(filter.userId, "user-a");
    assert.equal(filter.status, SUBSCRIPTION_STATUS.ACTIVE);
    assert.ok(filter.startDate.$lte instanceof Date);
    assert.ok(filter.endDate.$gt instanceof Date);
    assert.strictEqual(filter.startDate.$lte, filter.endDate.$gt);
    assert.ok(filter.startDate.$lte.getTime() >= beforeLookup);
    assert.ok(filter.startDate.$lte.getTime() <= afterLookup);
    assert.deepEqual(capture.queryStates[0].sort, {
        startDate: -1,
        createdAt: -1
    });
    assert.equal(capture.queryStates[0].limit, 2);
    assert.equal(capture.queryStates[0].populate, "planId");
});

test("limited usage summary reports consumed, limits, and non-negative remaining values", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        planId: { maxMovies: 10, maxSeries: 5, isLimited: true },
        usage: { movies: 7, series: 5 }
    });
    stubFind([subscription]);

    const result = await subscriptionService.getCurrentUsage("user-a");

    assert.deepEqual(result.usage, { movies: 7, series: 5 });
    assert.deepEqual(result.limits, { movies: 10, series: 5 });
    assert.deepEqual(result.remaining, { movies: 3, series: 0 });
    assert.equal(result.isLimited, true);
    assert.equal(result.subscriptionPeriod.startDate.getTime(), subscription.startDate.getTime());
    assert.equal(result.subscriptionPeriod.endDate.getTime(), subscription.endDate.getTime());
});

test("unlimited usage summary preserves counters and reports Unlimited allowances", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        planId: { maxMovies: 0, maxSeries: 0, isLimited: false },
        usage: { movies: 27, series: 14 }
    });
    stubFind([subscription]);

    const result = await subscriptionService.getCurrentUsage("user-a");

    assert.deepEqual(result.usage, { movies: 27, series: 14 });
    assert.deepEqual(result.limits, {
        movies: "Unlimited",
        series: "Unlimited"
    });
    assert.deepEqual(result.remaining, {
        movies: "Unlimited",
        series: "Unlimited"
    });
    assert.equal(result.isLimited, false);
});

test("unlimited plans record new views without applying finite Movie or Series limits", {
    concurrency: false
}, async() => {
    const subscription = makeSubscription({
        planId: { maxMovies: 0, maxSeries: 0, isLimited: false },
        usage: { movies: 27, series: 14 }
    });
    const capture = stubFind([subscription]);

    Subscription.findOneAndUpdate = async(filter, update) => {
        capture.updateFilter = filter;
        subscription.usage.movies += update.$inc["usage.movies"];
        subscription.consumedViewKeys.push(update.$addToSet.consumedViewKeys);
        return subscription;
    };
    SubscriptionUsage.create = async(entries) => [{
        ...entries[0],
        _id: "usage-unlimited-1"
    }];

    const result = await subscriptionService.consumeViewAllowance({
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-unlimited",
        contentType: CONTENT_TYPE.MOVIE
    });

    assert.equal(result.isNewUsage, true);
    assert.deepEqual(result.usage, { movies: 28, series: 14 });
    assert.equal(Object.hasOwn(capture.updateFilter, "$or"), false);
    assert.equal(
        Object.hasOwn(capture.updateFilter, "usage.movies"),
        false
    );
});

test("rollback removes the consumption key, decrements the counter, and deletes its ledger row", {
    concurrency: false
}, async() => {
    const state = {
        usage: { movies: 4, series: 1 },
        consumedViewKeys: ["profile-1:movie-1"],
        ledgerIds: new Set(["usage-1"])
    };
    const capture = {};

    Subscription.updateOne = async(filter, update, options) => {
        capture.updateFilter = filter;
        capture.update = update;
        capture.updateOptions = options;
        state.consumedViewKeys = state.consumedViewKeys.filter(
            (key) => key !== update.$pull.consumedViewKeys
        );
        state.usage.movies += update.$inc["usage.movies"];
        return { modifiedCount: 1 };
    };
    SubscriptionUsage.deleteOne = async(filter, options) => {
        capture.ledgerFilter = filter;
        capture.ledgerOptions = options;
        state.ledgerIds.delete(filter._id);
        return { deletedCount: 1 };
    };

    const result = await subscriptionService.rollbackViewAllowance({
        subscriptionId: "subscription-a",
        userId: "user-a",
        profileId: "profile-1",
        contentId: "movie-1",
        periodStart: new Date("2026-07-01T00:00:00.000Z"),
        consumptionKey: "profile-1:movie-1",
        usageField: "usage.movies",
        usageId: "usage-1",
        contentType: CONTENT_TYPE.MOVIE,
        isNewUsage: true
    });

    assert.deepEqual(result, { rolledBack: true });
    assert.deepEqual(state.usage, { movies: 3, series: 1 });
    assert.deepEqual(state.consumedViewKeys, []);
    assert.deepEqual([...state.ledgerIds], []);
    assert.deepEqual(capture.updateFilter, {
        _id: "subscription-a",
        userId: "user-a",
        "usage.movies": { $gt: 0 }
    });
    assert.deepEqual(capture.update, {
        $pull: { consumedViewKeys: "profile-1:movie-1" },
        $inc: { "usage.movies": -1 }
    });
    assert.deepEqual(capture.ledgerFilter, {
        _id: "usage-1",
        subscriptionId: "subscription-a",
        userId: "user-a"
    });
});

test("SubscriptionUsage unique index includes subscription period, profile, and content", {
    concurrency: false
}, () => {
    const uniqueIndex = SubscriptionUsage.schema.indexes().find(
        ([, options]) => options.name === "unique_subscription_period_view"
    );

    assert.ok(uniqueIndex, "expected unique_subscription_period_view index");
    assert.deepEqual(uniqueIndex[0], {
        subscriptionId: 1,
        periodStart: 1,
        profileId: 1,
        contentId: 1
    });
    assert.equal(uniqueIndex[1].unique, true);
});

test("Subscription stores account counters and enforces one active row per user", {
    concurrency: false
}, () => {
    assert.equal(Subscription.schema.path("usage.movies").options.default, 0);
    assert.equal(Subscription.schema.path("usage.series").options.default, 0);
    assert.equal(
        Subscription.schema.path("consumedViewKeys").options.select,
        false
    );

    const activeIndex = Subscription.schema.indexes().find(
        ([, options]) => options.name === "one_active_subscription_per_user"
    );

    assert.ok(activeIndex, "expected one_active_subscription_per_user index");
    assert.deepEqual(activeIndex[0], { userId: 1 });
    assert.equal(activeIndex[1].unique, true);
    assert.deepEqual(activeIndex[1].partialFilterExpression, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        userId: { $type: "objectId" }
    });
});

test("consumption keys canonicalize valid ObjectIds regardless of input casing", {
    concurrency: false
}, () => {
    const key = subscriptionService._buildConsumptionKey({
        profileId: "507F1F77BCF86CD799439011",
        contentId: "507F191E810C19729DE860EA"
    });

    assert.equal(
        key,
        "507f1f77bcf86cd799439011:507f191e810c19729de860ea"
    );
});

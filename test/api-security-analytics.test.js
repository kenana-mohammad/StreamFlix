'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const auth = require('../src/middlewares/auth');
const role = require('../src/middlewares/role');
const validateProfileOwnership = require('../src/middlewares/validateProfileOwnership');
const Profile = require('../src/modules/profiles/models/Profile');
const User = require('../src/modules/users/models/User');
const Content = require('../src/modules/content/models/Content');
const WatchHistory = require('../src/modules/watch-history/models/WatchHistory');
const SubscriptionUsage = require(
    '../src/modules/subscriptions/models/SubscriptionUsage'
);
const watchHistoryRouter = require('../src/modules/watch-history/routes/watch-history.routes');
const watchHistoryController = require('../src/modules/watch-history/controllers/watch-history.controller');
const watchHistoryService = require('../src/modules/watch-history/services/watch-history.service');
const {
    recordViewingValidation,
    deleteHistoryItemValidation
} = require('../src/modules/watch-history/validations/watch-history.validation');
const subscriptionRouter = require('../src/modules/subscriptions/routes/subscription.routes');
const subscriptionController = require('../src/modules/subscriptions/controllers/subscription.controller');
const subscriptionService = require('../src/modules/subscriptions/services/subscription.service');
const dashboardHistoryRouter = require('../src/modules/dashboard/routes/dashboard.history.routes');
const dashboardController = require('../src/modules/dashboard/controllers/dashboard.controller');
const dashboardService = require('../src/modules/dashboard/services/dashboard.service');
const { ROLES } = require('../src/shared/constants/roles.constant');
const { USER_STATUS } = require('../src/shared/constants/user-status.constant');
const { VIEW_ACTION } = require('../src/shared/constants/view-action.constant');

const PROFILE_ID = '507f1f77bcf86cd799439011';
const CONTENT_ID = '507f191e810c19729de860ea';
const EPISODE_ID = '507f1f77bcf86cd799439012';
const USER_ID = '507f1f77bcf86cd799439013';
const OTHER_USER_ID = '507f1f77bcf86cd799439014';

const serial = { concurrency: false };

const createMockResponse = () => ({
    statusCode: 200,
    body: undefined,
    headersSent: false,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.body = payload;
        this.headersSent = true;
        return this;
    },
    clearCookie() {
        return this;
    }
});

const invokeMiddleware = async(handler, req, res) => {
    let nextCalled = false;
    let nextError;

    const result = handler(req, res, (error) => {
        nextCalled = true;
        nextError = error;
    });

    await Promise.resolve(result);

    if (nextError) {
        throw nextError;
    }

    return nextCalled;
};

const runMiddlewareStack = async(stack, req) => {
    const res = createMockResponse();

    for (const middleware of stack) {
        const nextCalled = await invokeMiddleware(middleware, req, res);
        if (!nextCalled) {
            return { completed: false, req, res };
        }
    }

    return { completed: true, req, res };
};

const validViewingRequest = (overrides = {}) => ({
    params: { profileId: PROFILE_ID },
    body: {
        contentId: CONTENT_ID,
        progress: 42.5,
        totalDuration: 120,
        stoppedAt: '2026-07-24T10:15:30.000Z',
        episodeId: EPISODE_ID,
        ...overrides
    }
});

const validationFields = (res) =>
    new Set((res.body?.errors || []).map((error) => error.field));

const findRoute = (router, routePath, method) => {
    const layer = router.stack.find((candidate) =>
        candidate.route &&
        candidate.route.path === routePath &&
        candidate.route.methods[method]
    );

    assert.ok(layer, `${method.toUpperCase()} ${routePath} should be registered`);
    return layer.route;
};

test('record viewing validation rejects an invalid profileId', serial, async() => {
    const req = validViewingRequest();
    req.params.profileId = 'not-a-profile-id';

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.ok(validationFields(res).has('profileId'));
});

test('record viewing validation rejects an invalid contentId in the body', serial, async() => {
    const req = validViewingRequest({ contentId: 'not-a-content-id' });

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    assert.ok(validationFields(res).has('contentId'));
});

test('record viewing validation rejects missing required viewing fields', serial, async(t) => {
    for (const field of ['contentId', 'progress', 'totalDuration']) {
        await t.test(`missing ${field}`, async() => {
            const req = validViewingRequest();
            delete req.body[field];

            const { completed, res } = await runMiddlewareStack(
                recordViewingValidation,
                req
            );

            assert.equal(completed, false);
            assert.equal(res.statusCode, 400);
            assert.ok(validationFields(res).has(field));
        });
    }
});

test('record viewing validation rejects an invalid episodeId', serial, async() => {
    const req = validViewingRequest({ episodeId: 'not-an-episode-id' });

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    assert.ok(validationFields(res).has('episodeId'));
});

test('delete-item validation rejects an invalid contentId route parameter', serial, async() => {
    const req = {
        params: {
            profileId: PROFILE_ID,
            contentId: 'not-a-content-id'
        },
        body: {}
    };

    const { completed, res } = await runMiddlewareStack(deleteHistoryItemValidation, req);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    assert.ok(validationFields(res).has('contentId'));
});

test('record viewing validation rejects negative and over-duration progress', serial, async(t) => {
    await t.test('negative progress', async() => {
        const req = validViewingRequest({ progress: -0.01 });
        const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

        assert.equal(completed, false);
        assert.equal(res.statusCode, 400);
        assert.ok(validationFields(res).has('progress'));
    });

    await t.test('progress beyond total duration', async() => {
        const req = validViewingRequest({ progress: 121, totalDuration: 120 });
        const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

        assert.equal(completed, false);
        assert.equal(res.statusCode, 400);
        assert.ok(validationFields(res).has('progress'));
        assert.ok(
            res.body.errors.some((error) =>
                error.message === 'Progress cannot exceed total duration'
            )
        );
    });

    await t.test('total duration below one', async() => {
        const req = validViewingRequest({ progress: 0, totalDuration: 0.5 });
        const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

        assert.equal(completed, false);
        assert.equal(res.statusCode, 400);
        assert.ok(validationFields(res).has('totalDuration'));
        assert.ok(
            res.body.errors.some((error) =>
                error.message === 'Total duration must be at least 1'
            )
        );
    });
});

test('record viewing validation rejects an invalid stoppedAt value', serial, async() => {
    const req = validViewingRequest({ stoppedAt: '24 July, eventually' });

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    assert.ok(validationFields(res).has('stoppedAt'));
});

test('record viewing validation rejects client-controlled protected fields', serial, async() => {
    const req = validViewingRequest({
        userId: OTHER_USER_ID,
        profileId: PROFILE_ID,
        viewsCount: 999,
        usage: { movies: 999 },
        consumedUsage: { movies: 999 },
        remaining: { movies: 999 }
    });

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);
    const fields = validationFields(res);

    assert.equal(completed, false);
    assert.equal(res.statusCode, 400);
    for (const field of [
        'userId',
        'profileId',
        'viewsCount',
        'usage',
        'consumedUsage',
        'remaining'
    ]) {
        assert.ok(fields.has(field), `${field} should be rejected`);
    }
});

test('record viewing validation accepts and normalizes a valid payload', serial, async() => {
    const req = validViewingRequest({
        progress: '42.5',
        totalDuration: '120'
    });

    const { completed, res } = await runMiddlewareStack(recordViewingValidation, req);

    assert.equal(completed, true);
    assert.equal(res.headersSent, false);
    assert.equal(req.body.progress, 42.5);
    assert.equal(req.body.totalDuration, 120);
    assert.ok(req.body.stoppedAt instanceof Date);
    assert.equal(req.body.stoppedAt.toISOString(), '2026-07-24T10:15:30.000Z');
});

test('API routers register the expected methods and security middleware order', serial, async() => {
    const historyRoutes = watchHistoryRouter.stack
        .filter((layer) => layer.route)
        .flatMap((layer) =>
            Object.keys(layer.route.methods).map((method) =>
                `${method.toUpperCase()} ${layer.route.path}`
            )
        )
        .sort();

    assert.deepEqual(historyRoutes, [
        'DELETE /:profileId/history',
        'DELETE /:profileId/history/:contentId',
        'GET /:profileId/history',
        'POST /:profileId/history'
    ]);

    for (const [method, routePath] of [
        ['post', '/:profileId/history'],
        ['get', '/:profileId/history'],
        ['delete', '/:profileId/history/:contentId'],
        ['delete', '/:profileId/history']
    ]) {
        const route = findRoute(watchHistoryRouter, routePath, method);
        const handlers = route.stack.map((layer) => layer.handle);

        assert.equal(handlers[0], auth, `${method} ${routePath} must authenticate first`);
        assert.ok(
            handlers.includes(validateProfileOwnership),
            `${method} ${routePath} must enforce profile ownership`
        );
        assert.ok(
            handlers.indexOf(validateProfileOwnership) < handlers.length - 1,
            `${method} ${routePath} must authorize before its controller`
        );
    }

    const usageRoute = findRoute(subscriptionRouter, '/usage', 'get');
    assert.equal(usageRoute.stack[0].handle, auth);

    const analyticsRoute = findRoute(dashboardHistoryRouter, '/analytics', 'get');
    assert.equal(analyticsRoute.stack[0].handle, auth);
    assert.equal(analyticsRoute.stack.length, 3);

    const adminRoleHandler = analyticsRoute.stack[1].handle;
    const deniedRes = createMockResponse();
    const deniedNext = await invokeMiddleware(
        adminRoleHandler,
        { _user: { id: USER_ID, role: ROLES.USER } },
        deniedRes
    );
    assert.equal(deniedNext, false);
    assert.equal(deniedRes.statusCode, 403);
    assert.deepEqual(deniedRes.body, {
        success: false,
        message: 'You are not authorized to perform this action'
    });

    const allowedRes = createMockResponse();
    const allowedNext = await invokeMiddleware(
        adminRoleHandler,
        { _user: { id: USER_ID, role: ROLES.SUPER_ADMIN } },
        allowedRes
    );
    assert.equal(allowedNext, true);
    assert.equal(allowedRes.headersSent, false);

    const analyticsAdminOnly = role(
        [ROLES.SUPER_ADMIN],
        { standardResponse: true }
    );
    const analyticsDeniedRes = createMockResponse();
    const analyticsDeniedNext = await invokeMiddleware(
        analyticsAdminOnly,
        { _user: { id: USER_ID, role: ROLES.USER } },
        analyticsDeniedRes
    );

    assert.equal(analyticsDeniedNext, false);
    assert.equal(analyticsDeniedRes.statusCode, 403);
    assert.deepEqual(analyticsDeniedRes.body, {
        success: false,
        message: 'You are not authorized to perform this action'
    });
});

test('app mounts compose the documented full API paths', serial, () => {
    const appSource = fs
        .readFileSync(path.join(__dirname, '../src/app.js'), 'utf8')
        .replace(/\s+/g, ' ');

    assert.match(
        appSource,
        /app\.use\(\s*['"]\/api\/v1\/profiles['"]\s*,\s*require\(\s*['"]\.\/modules\/watch-history['"]\s*\)\s*\)/
    );
    assert.match(
        appSource,
        /app\.use\(\s*['"]\/api\/v1\/subscriptions['"]\s*,\s*require\(\s*['"]\.\/modules\/subscriptions\/routes\/subscription\.routes['"]\s*\)\s*\)/
    );
    assert.match(
        appSource,
        /app\.use\(\s*['"]\/api\/v1\/admin\/history['"]\s*,\s*require\(\s*['"]\.\/modules\/dashboard\/routes\/dashboard\.history\.routes['"]\s*\)\s*\)/
    );
});

test('auth returns the standard forbidden response when the access token is missing', serial, async() => {
    const req = { cookies: {} };
    const res = createMockResponse();

    const nextCalled = await invokeMiddleware(auth, req, res);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'يجب تسجيل الدخول'
    });
});

test('profile ownership blocks another user from new-view, update, and delete actions', serial, async(t) => {
    const profileQueries = [];

    t.mock.method(User, 'findById', async(userId) => {
        assert.equal(userId, USER_ID);
        return { _id: USER_ID, status: USER_STATUS.ACTIVE };
    });
    t.mock.method(Profile, 'findOne', async(query) => {
        profileQueries.push(query);

        if (query._id === PROFILE_ID && query.userId === OTHER_USER_ID) {
            return { _id: PROFILE_ID, userId: OTHER_USER_ID };
        }

        return null;
    });

    const attempts = [
        {
            label: 'start a new view',
            method: 'POST',
            body: { contentId: CONTENT_ID, progress: 0, totalDuration: 120 }
        },
        {
            label: 'update progress',
            method: 'POST',
            body: { contentId: CONTENT_ID, progress: 60, totalDuration: 120 }
        },
        {
            label: 'delete one history item',
            method: 'DELETE',
            params: { profileId: PROFILE_ID, contentId: CONTENT_ID },
            body: {}
        },
        {
            label: 'delete all history',
            method: 'DELETE',
            body: {}
        }
    ];

    for (const attempt of attempts) {
        const req = {
            method: attempt.method,
            params: attempt.params || { profileId: PROFILE_ID },
            body: attempt.body,
            _user: { id: USER_ID, role: ROLES.USER }
        };
        const res = createMockResponse();

        const nextCalled = await invokeMiddleware(validateProfileOwnership, req, res);

        assert.equal(nextCalled, false, `${attempt.label} must not reach the controller`);
        assert.equal(res.statusCode, 403);
        assert.deepEqual(res.body, {
            success: false,
            message: 'Invalid profile or unauthorized'
        });
    }

    assert.equal(profileQueries.length, attempts.length);
    for (const query of profileQueries) {
        assert.deepEqual(query, {
            _id: PROFILE_ID,
            userId: USER_ID
        });
    }
});

test('role middleware denies non-admin users and allows super_admin', serial, async() => {
    const adminOnly = role([ROLES.SUPER_ADMIN]);

    const deniedRes = createMockResponse();
    const deniedNext = await invokeMiddleware(
        adminOnly,
        { _user: { id: USER_ID, role: ROLES.USER } },
        deniedRes
    );

    assert.equal(deniedNext, false);
    assert.equal(deniedRes.statusCode, 403);
    assert.deepEqual(deniedRes.body, {
        msg: 'the Action canot maken by this user'
    });

    const allowedRes = createMockResponse();
    const allowedNext = await invokeMiddleware(
        adminOnly,
        { _user: { id: USER_ID, role: ROLES.SUPER_ADMIN } },
        allowedRes
    );

    assert.equal(allowedNext, true);
    assert.equal(allowedRes.headersSent, false);
});

test('usage controller derives identity only from req._user.id', serial, async(t) => {
    const usage = {
        usage: { movies: 3, series: 2 },
        limits: { movies: 10, series: 5 },
        remaining: { movies: 7, series: 3 },
        isLimited: true
    };
    let serviceArguments;

    t.mock.method(subscriptionService, 'getCurrentUsage', async(...args) => {
        serviceArguments = args;
        return usage;
    });

    const req = {
        _user: { id: USER_ID },
        params: { userId: OTHER_USER_ID },
        query: { userId: OTHER_USER_ID },
        body: { userId: OTHER_USER_ID }
    };
    const res = createMockResponse();

    await subscriptionController.getUsage(req, res);

    assert.deepEqual(serviceArguments, [USER_ID]);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        success: true,
        message: 'Subscription usage retrieved successfully',
        data: usage
    });
});

test('watch history controller whitelists viewing fields before calling its service', serial, async(t) => {
    const stoppedAt = new Date('2026-07-24T10:15:30.000Z');
    const serviceResult = {
        action: VIEW_ACTION.NEW_VIEW,
        history: { _id: 'history-id' },
        usageConsumed: true,
        viewsIncremented: true
    };
    let serviceArguments;

    t.mock.method(watchHistoryService, 'recordViewing', async(...args) => {
        serviceArguments = args;
        return serviceResult;
    });

    const req = {
        _user: { id: USER_ID },
        params: { profileId: PROFILE_ID },
        body: {
            contentId: CONTENT_ID,
            progress: 42.5,
            totalDuration: 120,
            stoppedAt,
            episodeId: EPISODE_ID,
            userId: OTHER_USER_ID,
            profileId: 'body-profile-id',
            viewsCount: 999,
            usage: { movies: 999 },
            consumedUsage: { movies: 999 },
            remaining: { movies: 999 },
            arbitraryField: 'must not pass'
        }
    };
    const res = createMockResponse();

    await watchHistoryController.recordViewing(req, res);

    assert.deepEqual(serviceArguments, [{
        userId: USER_ID,
        profileId: PROFILE_ID,
        contentId: CONTENT_ID,
        progress: 42.5,
        totalDuration: 120,
        stoppedAt,
        episodeId: EPISODE_ID
    }]);
    for (const protectedField of [
        'viewsCount',
        'usage',
        'consumedUsage',
        'remaining',
        'arbitraryField'
    ]) {
        assert.equal(
            Object.hasOwn(serviceArguments[0], protectedField),
            false,
            `${protectedField} must not reach the service`
        );
    }
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
        success: true,
        message: 'Viewing activity recorded successfully',
        data: serviceResult
    });
});

test('dashboard analytics service maps mocked aggregate results without a database', serial, async(t) => {
    const mostPopularContent = [{
        content: {
            _id: CONTENT_ID,
            title: 'Global hit',
            type: 'Movie',
            poster: 'poster.jpg'
        },
        globalViewsCount: 27
    }];
    const mostWatchedContent = [{
        content: {
            _id: CONTENT_ID,
            title: 'History leader',
            type: 'Series',
            poster: 'series.jpg'
        },
        profileHistoryCount: 6
    }];
    const viewingActivity = [
        { date: '2026-07-23', qualifyingNewViews: 2 },
        { date: '2026-07-24', qualifyingNewViews: 4 }
    ];
    const contentPipelines = [];
    let historyPipeline;
    let usagePipeline;

    t.mock.method(Content, 'aggregate', async(pipeline) => {
        contentPipelines.push(pipeline);

        if (pipeline[0]?.$group) {
            return [{ totalViews: 27 }];
        }

        return mostPopularContent;
    });
    t.mock.method(WatchHistory, 'aggregate', async(pipeline) => {
        historyPipeline = pipeline;
        return [{ mostWatchedContent }];
    });
    t.mock.method(SubscriptionUsage, 'aggregate', async(pipeline) => {
        usagePipeline = pipeline;
        return viewingActivity;
    });

    const result = await dashboardService.getHistoryAnalytics();

    assert.deepEqual(result, {
        totalViews: 27,
        mostWatchedContent,
        mostPopularContent,
        viewingActivity
    });
    assert.equal(contentPipelines.length, 2);

    const totalViewsPipeline = contentPipelines.find((pipeline) => pipeline[0]?.$group);
    const popularityPipeline = contentPipelines.find((pipeline) => pipeline[0]?.$sort);

    assert.ok(totalViewsPipeline);
    assert.deepEqual(totalViewsPipeline[0].$group.totalViews, {
        $sum: { $ifNull: ['$viewsCount', 0] }
    });
    assert.ok(popularityPipeline);
    assert.deepEqual(popularityPipeline[0].$sort, {
        viewsCount: -1,
        _id: 1
    });
    assert.ok(historyPipeline[0].$facet.mostWatchedContent);
    assert.equal(historyPipeline[0].$facet.viewingActivity, undefined);
    assert.equal(
        usagePipeline[0].$group._id.$dateToString.date,
        '$createdAt'
    );
    assert.deepEqual(usagePipeline[0].$group.qualifyingNewViews, { $sum: 1 });
});

test('dashboard controller formats a successful admin analytics response', serial, async(t) => {
    const analytics = {
        totalViews: 9,
        mostWatchedContent: [],
        mostPopularContent: [],
        viewingActivity: []
    };
    let calls = 0;

    t.mock.method(dashboardService, 'getHistoryAnalytics', async() => {
        calls += 1;
        return analytics;
    });

    const req = {
        _user: { id: USER_ID, role: ROLES.SUPER_ADMIN }
    };
    const res = createMockResponse();

    await dashboardController.getHistoryAnalytics(req, res);

    assert.equal(calls, 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        success: true,
        message: 'Watch history analytics retrieved successfully',
        data: analytics
    });
});

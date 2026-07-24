'use strict';

process.env.NODE_ENV = 'test';
process.env.USE_TRANSACTIONS = 'false';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const mongoose = require('mongoose');

const Content = require('../src/modules/content/models/Content');
const Episode = require('../src/modules/content/models/Episode');
const Profile = require('../src/modules/profiles/models/Profile');
const Season = require('../src/modules/content/models/Season');
const Series = require('../src/modules/content/models/Series');
const subscriptionService = require(
    '../src/modules/subscriptions/services/subscription.service'
);
const WatchHistory = require('../src/modules/watch-history/models/WatchHistory');
const watchHistoryService = require(
    '../src/modules/watch-history/services/watch-history.service'
);
const AppError = require('../src/shared/errors/AppError');
const { CONTENT_TYPE } = require(
    '../src/shared/constants/content-type.constant'
);
const { CONTENT_STATUS } = require(
    '../src/shared/constants/content-status.constant'
);
const { VIEW_ACTION } = require(
    '../src/shared/constants/view-action.constant'
);

const ids = Object.freeze({
    user: new mongoose.Types.ObjectId(),
    otherUser: new mongoose.Types.ObjectId(),
    profile: new mongoose.Types.ObjectId(),
    content: new mongoose.Types.ObjectId(),
    episode: new mongoose.Types.ObjectId(),
    season: new mongoose.Types.ObjectId(),
    series: new mongoose.Types.ObjectId(),
    history: new mongoose.Types.ObjectId()
});

const serialTest = (name, fn) => test(name, { concurrency: false }, fn);

const stubMethod = (t, target, methodName, implementation) => {
    const original = target[methodName];
    const calls = [];

    target[methodName] = function(...args) {
        calls.push(args);
        return implementation.apply(this, args);
    };

    t.after(() => {
        target[methodName] = original;
    });

    return calls;
};

const expectAppError = async(promise, statusCode, messagePattern) => {
    await assert.rejects(
        promise,
        (error) => {
            assert.ok(error instanceof AppError);
            assert.equal(error.statusCode, statusCode);
            assert.match(error.message, messagePattern);
            return true;
        }
    );
};

const stubOwnedProfile = (t, userId = ids.user) => {
    return stubMethod(t, Profile, 'findById', async(profileId) => ({
        _id: profileId,
        userId
    }));
};

const stubMovieContent = (t) => {
    return stubMethod(t, Content, 'findOne', async(filter) => ({
        _id: filter._id,
        type: CONTENT_TYPE.MOVIE
    }));
};

const stubActiveEntitlement = (t) => {
    return stubMethod(
        t,
        subscriptionService,
        'assertActiveEntitlement',
        async() => ({ _id: 'subscription-a' })
    );
};

const createPersistedHistory = (overrides = {}) => ({
    _id: ids.history,
    profileId: ids.profile,
    contentId: ids.content,
    episodeId: null,
    progressTime: 0,
    totalDuration: 100,
    completed: false,
    watchedAt: new Date('2026-07-01T00:00:00.000Z'),
    async save() {
        return this;
    },
    ...overrides
});

serialTest('WatchHistory model defines profile/content relations and retention indexes', () => {
    assert.equal(WatchHistory.schema.path('profileId').options.ref, 'Profile');
    assert.equal(WatchHistory.schema.path('contentId').options.ref, 'Content');
    assert.equal(WatchHistory.schema.path('episodeId').options.ref, 'Episode');
    assert.ok(WatchHistory.schema.path('createdAt'));
    assert.ok(WatchHistory.schema.path('updatedAt'));

    const indexes = WatchHistory.schema.indexes();
    const uniqueProfileContent = indexes.find(([fields, options]) => (
        fields.profileId === 1 &&
        fields.contentId === 1 &&
        options.unique === true
    ));
    const retention = indexes.find(([fields, options]) => (
        fields.updatedAt === 1 &&
        options.expireAfterSeconds === 365 * 24 * 60 * 60
    ));

    assert.ok(
        uniqueProfileContent,
        'profileId/contentId must be protected by a compound unique index'
    );
    assert.equal(
        uniqueProfileContent[1].name,
        'unique_profile_content_history'
    );
    assert.ok(
        retention,
        'history must expire one year after its last updatedAt activity'
    );
    assert.equal(retention[1].name, 'watch_history_retention');
});

serialTest('first view creates mapped history and increments content exactly once', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    stubMethod(t, WatchHistory, 'findOne', async() => null);

    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => ({ isNewUsage: true })
    );
    const stoppedAt = '2026-07-24T10:30:00.000Z';
    const persistedHistory = createPersistedHistory({
        progressTime: 24,
        totalDuration: 120,
        watchedAt: new Date(stoppedAt)
    });
    const historyUpsertCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndUpdate',
        async() => ({
            value: persistedHistory,
            lastErrorObject: { upserted: ids.history }
        })
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => ({ _id: ids.content, viewsCount: 1 })
    );

    const result = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 24,
        totalDuration: 120,
        stoppedAt
    });

    assert.equal(result.action, VIEW_ACTION.NEW_VIEW);
    assert.equal(result.history, persistedHistory);
    assert.equal(result.usageConsumed, true);
    assert.equal(result.viewsIncremented, true);
    assert.equal(allowanceCalls.length, 1);
    assert.deepEqual(allowanceCalls[0][0], {
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        contentType: CONTENT_TYPE.MOVIE,
        session: null
    });

    assert.equal(historyUpsertCalls.length, 1);
    const [historyFilter, historyUpdate, historyOptions] = historyUpsertCalls[0];
    assert.deepEqual(historyFilter, {
        profileId: ids.profile,
        contentId: ids.content
    });
    assert.equal(historyUpdate.$set.progressTime, 24);
    assert.equal(historyUpdate.$set.totalDuration, 120);
    assert.equal(historyUpdate.$set.completed, false);
    assert.equal(historyUpdate.$set.episodeId, null);
    assert.equal(
        historyUpdate.$set.watchedAt.toISOString(),
        new Date(stoppedAt).toISOString()
    );
    assert.deepEqual(historyUpdate.$setOnInsert, {
        profileId: ids.profile,
        contentId: ids.content
    });
    assert.equal(historyOptions.upsert, true);
    assert.equal(historyOptions.includeResultMetadata, true);

    assert.equal(contentUpdateCalls.length, 1);
    assert.deepEqual(contentUpdateCalls[0], [
        ids.content,
        { $inc: { viewsCount: 1 } },
        { new: true, session: null }
    ]);
});

serialTest('consumed replay rehydrates missing history without usage or view increments', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    stubMethod(t, WatchHistory, 'findOne', async() => null);

    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => ({ isNewUsage: false })
    );
    const persistedHistory = createPersistedHistory({
        progressTime: 35,
        watchedAt: new Date('2026-07-24T15:00:00.000Z')
    });
    const historyUpsertCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndUpdate',
        async() => ({
            value: persistedHistory,
            lastErrorObject: { upserted: ids.history }
        })
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('consumed replay must not increment views');
        }
    );

    const result = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 35,
        totalDuration: 100,
        stoppedAt: '2026-07-24T15:00:00.000Z'
    });

    assert.equal(result.action, VIEW_ACTION.RESUME);
    assert.equal(result.history, persistedHistory);
    assert.equal(result.usageConsumed, false);
    assert.equal(result.viewsIncremented, false);
    assert.equal(allowanceCalls.length, 1);
    assert.equal(historyUpsertCalls.length, 1);
    assert.equal(contentUpdateCalls.length, 0);
});

serialTest('nontransaction view increment failure compensates history and allowance', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    stubMethod(t, WatchHistory, 'findOne', async() => null);

    const consumption = {
        isNewUsage: true,
        subscriptionId: 'subscription-a',
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        consumptionKey: `${ids.profile}:${ids.content}`,
        usageField: 'usage.movies'
    };
    stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => consumption
    );
    stubMethod(
        t,
        WatchHistory,
        'findOneAndUpdate',
        async() => ({
            value: createPersistedHistory(),
            lastErrorObject: { upserted: ids.history }
        })
    );

    const downstreamError = new Error('content increment failed');
    stubMethod(t, Content, 'findByIdAndUpdate', async() => {
        throw downstreamError;
    });
    const deleteCalls = stubMethod(
        t,
        WatchHistory,
        'deleteOne',
        async() => ({ acknowledged: true, deletedCount: 1 })
    );
    const rollbackCalls = stubMethod(
        t,
        subscriptionService,
        'rollbackViewAllowance',
        async() => ({ rolledBack: true })
    );

    await assert.rejects(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        (error) => error === downstreamError
    );

    assert.deepEqual(deleteCalls, [[{ _id: ids.history }]]);
    assert.deepEqual(rollbackCalls, [[consumption]]);
});

serialTest('resume and repeated stoppedAt updates do not consume usage or increment views', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    const entitlementCalls = stubActiveEntitlement(t);

    let saveCount = 0;
    const history = createPersistedHistory({
        progressTime: 25,
        totalDuration: 100,
        async save() {
            saveCount += 1;
            return this;
        }
    });
    stubMethod(t, WatchHistory, 'findOne', async() => history);
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('resume must not consume an allowance');
        }
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('resume must not increment views');
        }
    );

    const firstResume = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 25,
        totalDuration: 100,
        stoppedAt: '2026-07-24T10:00:00.000Z'
    });
    const repeatedStoppedAt = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 25,
        totalDuration: 100,
        stoppedAt: '2026-07-24T11:00:00.000Z'
    });

    assert.equal(firstResume.action, VIEW_ACTION.RESUME);
    assert.equal(repeatedStoppedAt.action, VIEW_ACTION.RESUME);
    assert.equal(firstResume.usageConsumed, false);
    assert.equal(firstResume.viewsIncremented, false);
    assert.equal(repeatedStoppedAt.usageConsumed, false);
    assert.equal(repeatedStoppedAt.viewsIncremented, false);
    assert.equal(saveCount, 2);
    assert.equal(
        history.watchedAt.toISOString(),
        '2026-07-24T11:00:00.000Z'
    );
    assert.equal(allowanceCalls.length, 0);
    assert.equal(contentUpdateCalls.length, 0);
    assert.deepEqual(entitlementCalls, [
        [ids.user, null],
        [ids.user, null]
    ]);
});

serialTest('retained history from a prior subscription period remains a resume', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    const history = createPersistedHistory({
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        progressTime: 25,
        totalDuration: 100
    });
    stubMethod(t, WatchHistory, 'findOne', async() => history);
    const entitlementCalls = stubMethod(
        t,
        subscriptionService,
        'assertActiveEntitlement',
        async() => ({
            startDate: new Date('2026-07-01T00:00:00.000Z')
        })
    );
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('cross-period resume must not consume usage');
        }
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('cross-period resume must not increment views');
        }
    );

    const result = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 25,
        totalDuration: 100
    });

    assert.equal(result.action, VIEW_ACTION.RESUME);
    assert.equal(result.usageConsumed, false);
    assert.equal(result.viewsIncremented, false);
    assert.deepEqual(entitlementCalls, [[ids.user, null]]);
    assert.equal(allowanceCalls.length, 0);
    assert.equal(contentUpdateCalls.length, 0);
});

serialTest('progress update changes history without consuming usage or incrementing views', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    const entitlementCalls = stubActiveEntitlement(t);

    let saveOptions;
    const history = createPersistedHistory({
        progressTime: 10,
        totalDuration: 100,
        async save(options) {
            saveOptions = options;
            return this;
        }
    });
    stubMethod(t, WatchHistory, 'findOne', async() => history);
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('progress update must not consume usage');
        }
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('progress update must not increment views');
        }
    );

    const result = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        progress: 40,
        totalDuration: 100,
        stoppedAt: '2026-07-24T12:00:00.000Z'
    });

    assert.equal(result.action, VIEW_ACTION.PROGRESS_UPDATE);
    assert.equal(result.usageConsumed, false);
    assert.equal(result.viewsIncremented, false);
    assert.equal(history.progressTime, 40);
    assert.equal(history.totalDuration, 100);
    assert.equal(history.completed, false);
    assert.deepEqual(saveOptions, { session: null });
    assert.equal(allowanceCalls.length, 0);
    assert.equal(contentUpdateCalls.length, 0);
    assert.deepEqual(entitlementCalls, [[ids.user, null]]);
});

serialTest('deleteHistoryItem deletes one owned profile/content history item', async(t) => {
    stubOwnedProfile(t);
    const deletedHistory = createPersistedHistory();
    const deleteCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndDelete',
        async() => deletedHistory
    );

    const result = await watchHistoryService.deleteHistoryItem(
        ids.user,
        ids.profile,
        ids.content
    );

    assert.equal(result, deletedHistory);
    assert.deepEqual(deleteCalls, [[{
        profileId: ids.profile,
        contentId: ids.content
    }]]);
});

serialTest('getHistory returns populated resume data ordered by last watched time', async(t) => {
    stubOwnedProfile(t);
    const historyRows = [
        createPersistedHistory({ progressTime: 40 }),
        createPersistedHistory({ _id: new mongoose.Types.ObjectId(), progressTime: 10 })
    ];
    const populatedPaths = [];
    let sort;

    const findCalls = stubMethod(t, WatchHistory, 'find', () => ({
        populate(path) {
            populatedPaths.push(path);
            return this;
        },
        sort(value) {
            sort = value;
            return historyRows;
        }
    }));

    const result = await watchHistoryService.getHistory(ids.user, ids.profile);

    assert.deepEqual(result, historyRows);
    assert.deepEqual(findCalls, [[{ profileId: ids.profile }]]);
    assert.deepEqual(populatedPaths, [{
        path: 'contentId',
        match: { status: CONTENT_STATUS.PUBLISHED }
    }, 'episodeId']);
    assert.deepEqual(sort, { watchedAt: -1 });
});

serialTest('deleteAllHistory deletes all history for an owned profile', async(t) => {
    stubOwnedProfile(t);
    const deleteCalls = stubMethod(
        t,
        WatchHistory,
        'deleteMany',
        async() => ({ acknowledged: true, deletedCount: 3 })
    );

    const result = await watchHistoryService.deleteAllHistory(
        ids.user,
        ids.profile
    );

    assert.deepEqual(result, { deletedCount: 3 });
    assert.deepEqual(deleteCalls, [[{ profileId: ids.profile }]]);
});

serialTest('missing profile rejects before content or history access', async(t) => {
    stubMethod(t, Profile, 'findById', async() => null);
    const contentCalls = stubMethod(t, Content, 'findOne', async() => {
        throw new Error('content must not be queried');
    });
    const historyCalls = stubMethod(t, WatchHistory, 'findOne', async() => {
        throw new Error('history must not be queried');
    });

    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        404,
        /Profile not found/
    );

    assert.equal(contentCalls.length, 0);
    assert.equal(historyCalls.length, 0);
});

serialTest('missing content rejects before history or usage access', async(t) => {
    stubOwnedProfile(t);
    stubMethod(t, Content, 'findOne', async() => null);
    const historyCalls = stubMethod(t, WatchHistory, 'findOne', async() => {
        throw new Error('history must not be queried');
    });
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('usage must not be queried');
        }
    );

    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        404,
        /Content not found/
    );

    assert.equal(historyCalls.length, 0);
    assert.equal(allowanceCalls.length, 0);
});

serialTest('unpublished content is rejected through the published-content lookup', async(t) => {
    stubOwnedProfile(t);
    const contentCalls = stubMethod(t, Content, 'findOne', async() => null);
    const historyCalls = stubMethod(t, WatchHistory, 'findOne', async() => {
        throw new Error('history must not be queried for unpublished content');
    });
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('usage must not be queried for unpublished content');
        }
    );

    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        404,
        /Content not found or not available/
    );

    assert.deepEqual(contentCalls, [[{
        _id: ids.content,
        status: CONTENT_STATUS.PUBLISHED
    }]]);
    assert.equal(historyCalls.length, 0);
    assert.equal(allowanceCalls.length, 0);
});

serialTest('missing history item returns the standard not-found business error', async(t) => {
    stubOwnedProfile(t);
    stubMethod(t, WatchHistory, 'findOneAndDelete', async() => null);

    await expectAppError(
        watchHistoryService.deleteHistoryItem(
            ids.user,
            ids.profile,
            ids.content
        ),
        404,
        /Watch history item not found/
    );
});

serialTest('cross-user ownership blocks record, read, and delete operations', async(t) => {
    stubOwnedProfile(t, ids.otherUser);
    const contentCalls = stubMethod(t, Content, 'findOne', async() => {
        throw new Error('content must not be queried');
    });
    const findCalls = stubMethod(t, WatchHistory, 'find', () => {
        throw new Error('history must not be read');
    });
    const deleteOneCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndDelete',
        async() => {
            throw new Error('history must not be deleted');
        }
    );
    const deleteAllCalls = stubMethod(t, WatchHistory, 'deleteMany', async() => {
        throw new Error('history must not be deleted');
    });

    const operations = [
        () => watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        () => watchHistoryService.getHistory(ids.user, ids.profile),
        () => watchHistoryService.deleteHistoryItem(
            ids.user,
            ids.profile,
            ids.content
        ),
        () => watchHistoryService.deleteAllHistory(ids.user, ids.profile)
    ];

    for (const operation of operations) {
        await expectAppError(operation(), 403, /not authorized/i);
    }

    assert.equal(contentCalls.length, 0);
    assert.equal(findCalls.length, 0);
    assert.equal(deleteOneCalls.length, 0);
    assert.equal(deleteAllCalls.length, 0);
});

serialTest('invalid progress and stoppedAt are rejected before history or usage writes', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    const historyCalls = stubMethod(t, WatchHistory, 'findOne', async() => {
        throw new Error('history must not be queried');
    });
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('usage must not be consumed');
        }
    );

    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: -1,
            totalDuration: 100
        }),
        400,
        /Progress must be a non-negative number/
    );
    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 25,
            totalDuration: 100,
            stoppedAt: 'not-a-date'
        }),
        400,
        /StoppedAt must be a valid date/
    );
    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 0.5
        }),
        400,
        /Total duration must be at least 1/
    );

    assert.equal(historyCalls.length, 0);
    assert.equal(allowanceCalls.length, 0);
});

serialTest('Series view validates and stores an episode belonging to the content', async(t) => {
    stubOwnedProfile(t);
    stubMethod(t, Content, 'findOne', async() => ({
        _id: ids.content,
        type: CONTENT_TYPE.SERIES
    }));
    const episodeCalls = stubMethod(t, Episode, 'findById', async() => ({
        _id: ids.episode,
        seasonId: ids.season
    }));
    const seasonCalls = stubMethod(t, Season, 'findById', async() => ({
        _id: ids.season,
        seriesId: ids.series
    }));
    const seriesCalls = stubMethod(t, Series, 'findOne', async() => ({
        _id: ids.series,
        contentId: ids.content
    }));
    stubMethod(t, WatchHistory, 'findOne', async() => null);
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => ({ isNewUsage: true })
    );
    const upsertCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndUpdate',
        async() => ({
            value: createPersistedHistory({ episodeId: ids.episode }),
            lastErrorObject: { upserted: ids.history }
        })
    );
    stubMethod(t, Content, 'findByIdAndUpdate', async() => ({
        _id: ids.content,
        viewsCount: 1
    }));

    const result = await watchHistoryService._recordViewing({
        userId: ids.user,
        profileId: ids.profile,
        contentId: ids.content,
        episodeId: ids.episode,
        progress: 10,
        totalDuration: 45,
        stoppedAt: '2026-07-24T14:00:00.000Z'
    });

    assert.equal(result.action, VIEW_ACTION.NEW_VIEW);
    assert.deepEqual(episodeCalls, [[ids.episode]]);
    assert.deepEqual(seasonCalls, [[ids.season]]);
    assert.deepEqual(seriesCalls, [[{
        _id: ids.series,
        contentId: ids.content
    }]]);
    assert.equal(upsertCalls[0][1].$set.episodeId, ids.episode);
    assert.equal(allowanceCalls[0][0].contentType, CONTENT_TYPE.SERIES);
});

serialTest('Series view rejects an episode belonging to another content', async(t) => {
    stubOwnedProfile(t);
    stubMethod(t, Content, 'findOne', async() => ({
        _id: ids.content,
        type: CONTENT_TYPE.SERIES
    }));
    stubMethod(t, Episode, 'findById', async() => ({
        _id: ids.episode,
        seasonId: ids.season
    }));
    stubMethod(t, Season, 'findById', async() => ({
        _id: ids.season,
        seriesId: ids.series
    }));
    const seriesCalls = stubMethod(t, Series, 'findOne', async() => null);
    const historyCalls = stubMethod(t, WatchHistory, 'findOne', async() => {
        throw new Error('invalid episode must be rejected before history lookup');
    });
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('invalid episode must not consume usage');
        }
    );

    await expectAppError(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            episodeId: ids.episode,
            progress: 10,
            totalDuration: 45
        }),
        400,
        /Episode does not belong to the selected content/
    );

    assert.deepEqual(seriesCalls, [[{
        _id: ids.series,
        contentId: ids.content
    }]]);
    assert.equal(historyCalls.length, 0);
    assert.equal(allowanceCalls.length, 0);
});

serialTest('resume requires an active subscription entitlement before saving', async(t) => {
    stubOwnedProfile(t);
    stubMovieContent(t);

    let saveCalls = 0;
    const history = createPersistedHistory({
        progressTime: 25,
        async save() {
            saveCalls += 1;
            return this;
        }
    });
    stubMethod(t, WatchHistory, 'findOne', async() => history);
    const entitlementError = new AppError('No active subscription found', 403);
    const entitlementCalls = stubMethod(
        t,
        subscriptionService,
        'assertActiveEntitlement',
        async() => {
            throw entitlementError;
        }
    );
    const allowanceCalls = stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw new Error('resume must not consume a new allowance');
        }
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('resume must not increment views');
        }
    );

    await assert.rejects(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 25,
            totalDuration: 100
        }),
        (error) => error === entitlementError
    );

    assert.deepEqual(entitlementCalls, [[ids.user, null]]);
    assert.equal(saveCalls, 0);
    assert.equal(allowanceCalls.length, 0);
    assert.equal(contentUpdateCalls.length, 0);
});

const testAllowanceRejection = async(t, allowanceError) => {
    stubOwnedProfile(t);
    stubMovieContent(t);
    stubMethod(t, WatchHistory, 'findOne', async() => null);
    stubMethod(
        t,
        subscriptionService,
        'consumeViewAllowance',
        async() => {
            throw allowanceError;
        }
    );
    const historyUpsertCalls = stubMethod(
        t,
        WatchHistory,
        'findOneAndUpdate',
        async() => {
            throw new Error('history must not be created');
        }
    );
    const contentUpdateCalls = stubMethod(
        t,
        Content,
        'findByIdAndUpdate',
        async() => {
            throw new Error('views must not be incremented');
        }
    );
    const rollbackCalls = stubMethod(
        t,
        subscriptionService,
        'rollbackViewAllowance',
        async() => {
            throw new Error('a rejected allowance was never consumed');
        }
    );

    await assert.rejects(
        watchHistoryService._recordViewing({
            userId: ids.user,
            profileId: ids.profile,
            contentId: ids.content,
            progress: 0,
            totalDuration: 100
        }),
        (error) => {
            assert.equal(error, allowanceError);
            return true;
        }
    );

    assert.equal(historyUpsertCalls.length, 0);
    assert.equal(contentUpdateCalls.length, 0);
    assert.equal(rollbackCalls.length, 0);
};

serialTest('no-active-subscription error propagates without history or view writes', async(t) => {
    await testAllowanceRejection(
        t,
        new AppError('No active subscription found', 403)
    );
});

serialTest('exhausted-plan error propagates without history or view writes', async(t) => {
    await testAllowanceRejection(
        t,
        new AppError(
            'Movie viewing limit has been exhausted for the current subscription period',
            403
        )
    );
});

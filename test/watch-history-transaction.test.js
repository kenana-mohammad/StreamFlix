'use strict';

process.env.NODE_ENV = 'test';
process.env.USE_TRANSACTIONS = 'true';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

const servicePath = require.resolve(
    '../src/modules/watch-history/services/watch-history.service'
);

test('recordViewing runs the viewing workflow in one MongoDB transaction', async(t) => {
    const originalStartSession = mongoose.startSession;
    let transactionCalls = 0;
    let endSessionCalls = 0;
    const session = {
        async withTransaction(work) {
            transactionCalls += 1;
            await work();
        },
        async endSession() {
            endSessionCalls += 1;
        }
    };

    mongoose.startSession = async() => session;
    delete require.cache[servicePath];
    const watchHistoryService = require(servicePath);
    const originalRecordViewing = watchHistoryService._recordViewing;
    const expected = { action: 'NEW_VIEW' };
    let receivedRequest;
    let receivedSession;

    watchHistoryService._recordViewing = async(request, activeSession) => {
        receivedRequest = request;
        receivedSession = activeSession;
        return expected;
    };

    t.after(() => {
        watchHistoryService._recordViewing = originalRecordViewing;
        mongoose.startSession = originalStartSession;
        delete require.cache[servicePath];
    });

    const request = {
        userId: new mongoose.Types.ObjectId(),
        profileId: new mongoose.Types.ObjectId(),
        contentId: new mongoose.Types.ObjectId(),
        progress: 10,
        totalDuration: 100
    };
    const result = await watchHistoryService.recordViewing(request);

    assert.equal(result, expected);
    assert.equal(transactionCalls, 1);
    assert.equal(endSessionCalls, 1);
    assert.equal(receivedRequest, request);
    assert.equal(receivedSession, session);
});

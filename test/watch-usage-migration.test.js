'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const {
    buildConsumptionKey,
    preserveRecordedUsage
} = require('../src/scripts/migrateWatchHistoryUsage');

test('migration canonicalizes profile/content keys', () => {
    const profileId = new mongoose.Types.ObjectId();
    const contentId = new mongoose.Types.ObjectId();

    assert.equal(
        buildConsumptionKey(
            profileId.toHexString().toUpperCase(),
            contentId.toHexString().toUpperCase()
        ),
        `${profileId.toHexString()}:${contentId.toHexString()}`
    );
});

test('migration backfill never lowers recorded current-period usage', () => {
    assert.equal(preserveRecordedUsage(8, 5), 8);
    assert.equal(preserveRecordedUsage(3, 5), 5);
    assert.equal(preserveRecordedUsage(undefined, 2), 2);
    assert.equal(preserveRecordedUsage('invalid', 4), 4);
});

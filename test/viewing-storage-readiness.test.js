'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    assertViewingStorageReady
} = require('../src/utils/viewingStorageReadiness');

const makeModel = (collectionName, indexes) => ({
    collection: {
        name: collectionName,
        listIndexes() {
            return {
                async toArray() {
                    return indexes;
                }
            };
        }
    }
});

test('production readiness rejects a standalone MongoDB deployment', async() => {
    const connection = {
        db: {
            admin() {
                return {
                    async command() {
                        return { isWritablePrimary: true };
                    }
                };
            }
        }
    };

    await assert.rejects(
        assertViewingStorageReady({
            connection,
            indexRequirements: []
        }),
        /transaction-capable MongoDB/
    );
});

test('production readiness verifies required unique and TTL indexes', async() => {
    const connection = {
        db: {
            admin() {
                return {
                    async command() {
                        return { setName: 'rs0' };
                    }
                };
            }
        }
    };
    const model = makeModel('watchhistories', [
        { name: 'unique_history', unique: true },
        { name: 'history_ttl', expireAfterSeconds: 31536000 }
    ]);

    await assert.doesNotReject(
        assertViewingStorageReady({
            connection,
            indexRequirements: [
                {
                    model,
                    name: 'unique_history',
                    unique: true
                },
                {
                    model,
                    name: 'history_ttl',
                    expireAfterSeconds: 31536000
                }
            ]
        })
    );
});

test('production readiness blocks startup when migration indexes are absent', async() => {
    const connection = {
        db: {
            admin() {
                return {
                    async command() {
                        return { msg: 'isdbgrid' };
                    }
                };
            }
        }
    };
    const model = makeModel('subscriptionusages', []);

    await assert.rejects(
        assertViewingStorageReady({
            connection,
            indexRequirements: [{
                model,
                name: 'unique_subscription_period_view',
                unique: true
            }]
        }),
        /migrate:watch-usage/
    );
});

'use strict';

process.env.NODE_ENV = 'test';
process.env.USE_TRANSACTIONS = 'true';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

const Payment = require('../src/modules/Payment/model/Payment');
const Subscription = require('../src/modules/subscriptions/models/Subscription');
const subscriptionService = require(
    '../src/modules/subscriptions/services/subscription.service'
);
const {
    SUBSCRIPTION_STATUS
} = require('../src/shared/constants/subscription-status.constant');

const makeQuery = (result) => ({
    populate() {
        return this;
    },
    session() {
        return this;
    },
    sort() {
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
    }
});

test('automatic renewal atomically uses the contractual boundary and deterministic payment ID', async(t) => {
    const original = {
        startSession: mongoose.startSession,
        subscriptionFindOne: Subscription.findOne,
        subscriptionFindOneAndUpdate: Subscription.findOneAndUpdate,
        paymentFindOne: Payment.findOne,
        paymentCreate: Payment.create
    };
    const expectedEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const plan = {
        _id: 'plan-a',
        duration: 30,
        price: 12
    };
    const subscription = {
        _id: 'subscription-a',
        userId: 'user-a',
        planId: plan
    };
    const session = {
        transactionCalls: 0,
        endCalls: 0,
        async withTransaction(work) {
            this.transactionCalls += 1;
            await work();
        },
        async endSession() {
            this.endCalls += 1;
        }
    };
    let renewalFilter;
    let renewalUpdate;
    let renewalOptions;
    let paymentEntries;
    let paymentOptions;
    const paymentQueries = [];

    mongoose.startSession = async() => session;
    Subscription.findOne = () => makeQuery(subscription);
    Subscription.findOneAndUpdate = async(filter, update, options) => {
        renewalFilter = filter;
        renewalUpdate = update;
        renewalOptions = options;
        return {
            _id: subscription._id,
            userId: subscription.userId
        };
    };
    Payment.findOne = (filter) => {
        paymentQueries.push(filter);
        return makeQuery(null);
    };
    Payment.create = async(entries, options) => {
        paymentEntries = entries;
        paymentOptions = options;
        return entries;
    };

    t.after(() => {
        mongoose.startSession = original.startSession;
        Subscription.findOne = original.subscriptionFindOne;
        Subscription.findOneAndUpdate = original.subscriptionFindOneAndUpdate;
        Payment.findOne = original.paymentFindOne;
        Payment.create = original.paymentCreate;
    });

    const result = await subscriptionService.renewExpiredAutomatic({
        subscriptionId: subscription._id,
        expectedEndDate
    });
    const expectedTransactionId = (
        `AUTO_RENEW_${subscription._id}_${expectedEndDate.getTime()}`
    );

    assert.equal(result.renewed, true);
    assert.equal(session.transactionCalls, 1);
    assert.equal(session.endCalls, 1);
    assert.deepEqual(renewalFilter, {
        _id: subscription._id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        autoRenew: true,
        endDate: expectedEndDate
    });
    assert.equal(
        renewalUpdate.$set.startDate.getTime(),
        expectedEndDate.getTime()
    );
    assert.equal(
        renewalUpdate.$set.endDate.getTime(),
        new Date(expectedEndDate).setDate(
            expectedEndDate.getDate() + plan.duration
        )
    );
    assert.deepEqual(renewalUpdate.$set.usage, {
        movies: 0,
        series: 0
    });
    assert.deepEqual(renewalOptions, {
        new: true,
        session
    });
    assert.equal(paymentQueries[0].transactionId, expectedTransactionId);
    assert.equal(paymentEntries[0].transactionId, expectedTransactionId);
    assert.deepEqual(paymentOptions, { session });
});

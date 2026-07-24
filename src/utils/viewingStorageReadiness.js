const mongoose = require('mongoose');
const WatchHistory = require('../modules/watch-history/models/WatchHistory');
const Subscription = require('../modules/subscriptions/models/Subscription');
const SubscriptionUsage = require('../modules/subscriptions/models/SubscriptionUsage');

const migrationCommand = 'npm run migrate:watch-usage -- --apply';

const requiredIndexes = [
    {
        model: WatchHistory,
        name: 'unique_profile_content_history',
        unique: true
    },
    {
        model: WatchHistory,
        name: 'watch_history_retention',
        expireAfterSeconds: 365 * 24 * 60 * 60
    },
    {
        model: SubscriptionUsage,
        name: 'unique_subscription_period_view',
        unique: true
    },
    {
        model: Subscription,
        name: 'one_active_subscription_per_user',
        unique: true
    }
];

const assertViewingStorageReady = async({
    connection = mongoose.connection,
    indexRequirements = requiredIndexes
} = {}) => {
    const hello = await connection.db.admin().command({ hello: 1 });
    const supportsTransactions = Boolean(
        hello.setName ||
        hello.msg === 'isdbgrid' ||
        hello.serviceId
    );

    if (!supportsTransactions) {
        throw new Error(
            'Production viewing operations require a transaction-capable MongoDB deployment'
        );
    }

    const indexesByCollection = new Map();

    for (const requirement of indexRequirements) {
        const collectionName = requirement.model.collection.name;

        if (!indexesByCollection.has(collectionName)) {
            let indexes;

            try {
                indexes = await requirement.model.collection
                    .listIndexes()
                    .toArray();
            } catch (error) {
                throw new Error(
                    `Viewing storage is not migrated for ${collectionName}; run ${migrationCommand}`,
                    { cause: error }
                );
            }

            indexesByCollection.set(
                collectionName,
                new Map(indexes.map((index) => [index.name, index]))
            );
        }

        const index = indexesByCollection
            .get(collectionName)
            .get(requirement.name);
        const uniqueMatches = (
            requirement.unique === undefined ||
            index?.unique === requirement.unique
        );
        const retentionMatches = (
            requirement.expireAfterSeconds === undefined ||
            index?.expireAfterSeconds === requirement.expireAfterSeconds
        );

        if (!index || !uniqueMatches || !retentionMatches) {
            throw new Error(
                `Required viewing index ${requirement.name} is missing or invalid; ` +
                `run ${migrationCommand}`
            );
        }
    }
};

module.exports = {
    assertViewingStorageReady,
    requiredIndexes
};

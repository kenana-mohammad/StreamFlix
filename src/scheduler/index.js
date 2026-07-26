const subscriptionScheduler = require('./subscriptionScheduler');
const historyCleanupScheduler = require('./historyCleanupScheduler');
// const contentScheduler = require('./contentScheduler'); 

const initSchedulers = () => {
    subscriptionScheduler.init();
    // contentScheduler.init();
    historyCleanupScheduler.init();
    console.log('All Schedulers Initialized Successfully.');
};

module.exports = { initSchedulers };

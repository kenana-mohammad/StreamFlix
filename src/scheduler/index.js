const subscriptionScheduler = require('./subscriptionScheduler');
// const contentScheduler = require('./contentScheduler'); 

const initSchedulers = () => {
    subscriptionScheduler.init();
    // contentScheduler.init();
    console.log('All Schedulers Initialized Successfully.');
};

module.exports = { initSchedulers };
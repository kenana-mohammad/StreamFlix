// modules/subscriptions/routes/index.js

const express = require('express');
const subscriptionRoutes = require('./routes/subscription.routes');
const consumptionRoutes = require('./routes/consumption.routes');

const router = express.Router();


router.use('/', subscriptionRoutes);
router.use('/', consumptionRoutes);

module.exports = router;
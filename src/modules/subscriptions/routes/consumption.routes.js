const express = require('express');
const { checkActiveSubscription } = require('../../../middlewares/checkActiveSubscription');
const auth = require('../../../middlewares/Auth');
const validateActiveProfile = require('../../../middlewares/validateActiveProfile');
const asyncHandler = require('../../../utils/asyncHandler');
const consumptionController = require('../controllers/consumption.controller');

const router = express.Router();

router.get(
    '/consumption', [auth, checkActiveSubscription],
    asyncHandler(consumptionController.getSummary)
);

router.get(
    '/consumption/content', [auth, checkActiveSubscription],
    asyncHandler(consumptionController.getConsumedContent)
);



module.exports = router;
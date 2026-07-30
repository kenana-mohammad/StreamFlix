const express = require('express');
const { checkActiveSubscription } = require('../../../middlewares/checkActiveSubscription');
const auth = require('../../../middlewares/Auth');
const asyncHandler = require('../../../utils/asyncHandler');
const consumptionController = require('../controllers/consumption.controller');
const validatePrimaryProfile = require('../../../middlewares/validatePrimaryProfile');

const router = express.Router();

router.get(
    '/consumption', [auth, checkActiveSubscription, validatePrimaryProfile],
    asyncHandler(consumptionController.getSummary)
);

router.get(
    '/consumption/content', [auth, checkActiveSubscription, validatePrimaryProfile],
    asyncHandler(consumptionController.getConsumedContent)
);



module.exports = router;
const express = require('express');
const { checkActiveSubscription } = require('../../../middlewares/checkActiveSubscription');
const auth = require('../../../middlewares/Auth');
const validateActiveProfile = require("./../../../middlewares/validateActiveProfile");
const asyncHandler = require('../../../utils/asyncHandler');
const watchHistoryController = require('../controllers/watchHistory.controller');
const router = express.Router();


router.post(
    '/history',

    [
        auth,
        checkActiveSubscription,
        validateActiveProfile
    ],

    asyncHandler(
        watchHistoryController.saveProgress
    )
);


router.get(
    '/history',

    [
        auth,
        checkActiveSubscription,
        validateActiveProfile
    ],

    asyncHandler(
        watchHistoryController.getHistory
    )
);


router.delete(
    '/history/:contentId',

    [
        auth,
        checkActiveSubscription,
        validateActiveProfile
    ],

    asyncHandler(
        watchHistoryController.deleteOne
    )
);


router.delete(
    '/history',

    [
        auth,
        checkActiveSubscription,
        validateActiveProfile
    ],

    asyncHandler(
        watchHistoryController.deleteAll
    )
);


module.exports = router;
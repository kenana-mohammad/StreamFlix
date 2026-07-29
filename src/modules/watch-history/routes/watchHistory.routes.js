const express = require('express');
const { checkActiveSubscription } = require('../../../middlewares/checkActiveSubscription');
const auth = require('../../../middlewares/Auth');
const asyncHandler = require('../../../utils/asyncHandler');
const watchHistoryController = require('../controllers/watchHistory.controller');
const validateProfileToken = require('../../../middlewares/validateProfileToken');
const router = express.Router();


router.post(
    '/history',

    [
        auth,
        checkActiveSubscription,
        validateProfileToken
    ],

    asyncHandler(
        watchHistoryController.saveProgress
    )
);


router.get(
    '/history',

    [
        auth,
        validateProfileToken
    ],

    asyncHandler(
        watchHistoryController.getHistory
    )
);
router.get(
    '/history/:contentId', [
        auth,
        validateProfileToken
    ],
    asyncHandler(
        watchHistoryController.getOne
    )
);

router.delete(
    '/history/:contentId',

    [
        auth,
        validateProfileToken
    ],

    asyncHandler(
        watchHistoryController.deleteOne
    )
);


router.delete(
    '/history',

    [
        auth,
        validateProfileToken
    ],

    asyncHandler(
        watchHistoryController.deleteAll
    )
);


module.exports = router;
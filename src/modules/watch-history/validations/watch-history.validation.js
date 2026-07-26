const mongoose = require('mongoose');
const {
    body,
    param
} = require('express-validator');
const validate = require('../../../middlewares/validate');

const profileIdValidation = [
    param('profileId')
    .custom((value, { req }) => {
        const profileId = value || req.headers['x-profile-id'];

        if (!profileId) {
            throw new Error('Profile ID is required');
        }

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            throw new Error('Invalid Profile ID format');
        }

        return true;
    })
];

const saveHistoryValidation = [
    ...profileIdValidation,
    body('contentId')
    .notEmpty()
    .withMessage('Content ID is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid Content ID format'),
    body('progress')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Progress must be a non-negative number')
    .toFloat(),
    body('stoppedAt')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('StoppedAt must be a valid ISO date')
    .toDate(),
    body('totalDuration')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Total duration must be greater than 0')
    .toFloat(),
    body('episodeId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid Episode ID format'),
    body('viewSessionId')
    .notEmpty()
    .withMessage('View session ID is required')
    .bail()
    .isUUID()
    .withMessage('View session ID must be a valid UUID')
    .toLowerCase(),
    body()
    .custom((value) => {
        if (
            value.progress !== undefined &&
            value.totalDuration !== undefined &&
            Number(value.progress) > Number(value.totalDuration)
        ) {
            throw new Error('Progress cannot exceed total duration');
        }

        return true;
    }),
    validate
];

const getHistoryValidation = [
    ...profileIdValidation,
    validate
];

const removeHistoryItemValidation = [
    ...profileIdValidation,
    param('contentId')
    .isMongoId()
    .withMessage('Invalid Content ID format'),
    validate
];

const clearHistoryValidation = [
    ...profileIdValidation,
    validate
];

module.exports = {
    saveHistoryValidation,
    getHistoryValidation,
    removeHistoryItemValidation,
    clearHistoryValidation
};

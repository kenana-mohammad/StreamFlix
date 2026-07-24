const { body, param } = require('express-validator');
const validate = require('../../../middlewares/validate');

const profileIdRule = () => param('profileId')
    .isMongoId()
    .withMessage('Profile ID is invalid');

const contentIdParamRule = () => param('contentId')
    .isMongoId()
    .withMessage('Content ID is invalid');

const protectedFieldRules = [
    body('userId')
        .not()
        .exists()
        .withMessage('userId cannot be supplied by the client'),
    body('profileId')
        .not()
        .exists()
        .withMessage('profileId cannot be supplied in the request body'),
    body('viewsCount')
        .not()
        .exists()
        .withMessage('viewsCount cannot be supplied by the client'),
    body('usage')
        .not()
        .exists()
        .withMessage('usage cannot be supplied by the client'),
    body('consumedUsage')
        .not()
        .exists()
        .withMessage('consumedUsage cannot be supplied by the client'),
    body('remaining')
        .not()
        .exists()
        .withMessage('remaining cannot be supplied by the client')
];

const recordViewingValidation = [
    profileIdRule(),
    body('contentId')
        .notEmpty()
        .withMessage('Content ID is required')
        .isMongoId()
        .withMessage('Content ID is invalid'),
    body('progress')
        .exists({ checkNull: true })
        .withMessage('Progress is required')
        .isFloat({ min: 0 })
        .withMessage('Progress must be a non-negative number')
        .toFloat()
        .custom((progress, { req }) => {
            const totalDuration = Number(req.body.totalDuration);

            if (Number.isFinite(totalDuration) && progress > totalDuration) {
                throw new Error('Progress cannot exceed total duration');
            }

            return true;
        }),
    body('totalDuration')
        .exists({ checkNull: true })
        .withMessage('Total duration is required')
        .isFloat({ min: 1 })
        .withMessage('Total duration must be at least 1')
        .toFloat(),
    body('stoppedAt')
        .optional()
        .isISO8601({ strict: true })
        .withMessage('StoppedAt must be a valid ISO 8601 date')
        .toDate(),
    body('episodeId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Episode ID is invalid'),
    ...protectedFieldRules,
    validate
];

const profileHistoryValidation = [
    profileIdRule(),
    validate
];

const deleteHistoryItemValidation = [
    profileIdRule(),
    contentIdParamRule(),
    validate
];

module.exports = {
    recordViewingValidation,
    profileHistoryValidation,
    deleteHistoryItemValidation
};

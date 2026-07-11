const { body, param } = require('express-validator');

const createEpisodeValidator = [
    body('seasonId').isMongoId().withMessage('Season ID is invalid'),
    body('episodeNumber').isInt({ min: 1 }).withMessage('Episode number is required'),
    body('title').trim().notEmpty().withMessage('Episode title is required'),
    body('description').optional().isString(),
    body('duration').isInt({ min: 1 }).withMessage('Episode duration is required'),
    body('videoUrl').notEmpty().withMessage('Video URL is required')
];

const episodeIdValidator = [
    param('id').isMongoId().withMessage('Episode ID is invalid')
];

const updateEpisodeValidator = [
    body('episodeNumber').optional().isInt({ min: 1 }),
    body('title').optional().trim().notEmpty(),
    body('description').optional().isString(),
    body('duration').optional().isInt({ min: 1 }),
    body('videoUrl').optional().notEmpty()
];

module.exports = { createEpisodeValidator, episodeIdValidator, updateEpisodeValidator };
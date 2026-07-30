const { body, param } = require('express-validator');

const createSeasonValidator = [
    param('seriesId').isMongoId().withMessage('Series ID is invalid'),
    body('seasonNumber').isInt({ min: 1 }).withMessage('Season number is required and must be a positive integer'),
    body('title').optional().isString().trim(),
];

const seasonIdValidator = [
    param('id').isMongoId().withMessage('Season ID is invalid')
];

const updateSeasonValidator = [
    body('seasonNumber').optional().isInt({ min: 1 }),
    body('title').optional().isString().trim(),
];

module.exports = { createSeasonValidator, seasonIdValidator, updateSeasonValidator };
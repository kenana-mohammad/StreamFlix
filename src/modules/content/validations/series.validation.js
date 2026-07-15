const { param, body } = require('express-validator');
const { baseContentValidator, updateContentValidator } = require('./content.validation');

const createSeriesValidator = [
    ...baseContentValidator
];

const seriesIdValidator = [
    param('id').isMongoId().withMessage('Series ID is invalid')
];

const updateSeriesValidator = [
    ...updateContentValidator,
    body('totalSeasons')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total seasons must be a non-negative integer')
];

module.exports = { 
    createSeriesValidator, 
    seriesIdValidator,
    updateSeriesValidator
};
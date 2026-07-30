const { body, param } = require('express-validator');
const { baseContentValidator } = require('./content.validation');

const createMovieValidator = [
    ...baseContentValidator,
    
    body('duration').isInt({ min: 1 }).withMessage('Movie duration is required and must be a positive integer'),
    body('videoUrl').notEmpty().withMessage('Video URL is required')
];

const movieIdValidator = [
    param('id').isMongoId().withMessage('Movie ID is invalid')
];

const { updateContentValidator } = require('./content.validation');

const updateMovieValidator = [
    ...updateContentValidator,
    body('duration').optional().isInt({ min: 1 }).withMessage('Movie duration must be a positive integer'),
    body('videoUrl').optional().notEmpty().withMessage('Video URL cannot be empty')
];

module.exports = {
    createMovieValidator,
    movieIdValidator,
    updateMovieValidator
};
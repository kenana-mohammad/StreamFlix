const { body, param } = require('express-validator');
const { CONTENT_STATUS } = require('../../../shared/constants/content-status.constant');
const { AGE_RATING } = require('../../../shared/constants/age-rating.constant');

const baseContentValidator = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('poster').notEmpty().withMessage('Poster URL is required'),
    body('ageRating').isIn(Object.values(AGE_RATING)).withMessage('Invalid age rating'),
    body('trailerUrl').optional().isString(),
    body('releaseYear').isInt({ min: 1900 }).withMessage('Invalid release year'),
    body('status').optional().isIn(Object.values(CONTENT_STATUS)).withMessage('Invalid content status'),
    body('publishAt').optional().isISO8601().toDate().withMessage('Invalid publish date format'),
    
    // Relations 
    body('genres').optional().isArray().withMessage('Genres must be an array of IDs'),
    body('genres.*').optional().isMongoId().withMessage('Invalid Genre ID'),
    body('casts').optional().isArray().withMessage('Cast must be an array of objects'),
    body('casts.*.castId').optional().isMongoId().withMessage('Invalid Cast ID'),
    body('casts.*.characterName').optional().trim().notEmpty().withMessage('Character name is required')
];
const updateContentValidator = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('poster').optional().notEmpty().withMessage('Poster URL cannot be empty'),
    body('ageRating').optional().isIn(Object.values(AGE_RATING)).withMessage('Invalid age rating'),
    body('trailerUrl').optional().isString(),
    body('releaseYear').optional().isInt({ min: 1900 }).withMessage('Invalid release year'),
    body('publishAt').optional().isISO8601().toDate().withMessage('Invalid publish date format'),
    
    // Relations 
    body('genres').optional().isArray().withMessage('Genres must be an array of IDs'),
    body('genres.*').optional().isMongoId().withMessage('Invalid Genre ID'),
    body('casts').optional().isArray().withMessage('Cast must be an array of objects'),
    body('casts.*.castId').optional().isMongoId().withMessage('Invalid Cast ID'),
    body('casts.*.characterName').optional().trim().notEmpty().withMessage('Character name is required')
];
const changeStatusValidator = [
    body('status').notEmpty().isIn(Object.values(CONTENT_STATUS)).withMessage('Content status is required and must be valid')
];

const contentIdValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid')
];

module.exports = {
    baseContentValidator,
    updateContentValidator,
    changeStatusValidator,
    contentIdValidator
};
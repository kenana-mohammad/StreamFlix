const { body, param } = require('express-validator');

const addGenresValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid'),
    body('genreIds').isArray({ min: 1 }).withMessage('genreIds must be an array of IDs'),
    body('genreIds.*').isMongoId().withMessage('Each genreId must be a valid Mongo ID')
];

const removeGenreValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid'),
    param('genreId').isMongoId().withMessage('Genre ID is invalid')
];

const addCastValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid'),
    body('castId').isMongoId().withMessage('Cast ID is invalid and required'),
    body('characterName').trim().notEmpty().withMessage('Character name is required')
];

const updateCastValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid'),
    param('castId').isMongoId().withMessage('Cast ID is invalid'),
    body('characterName').trim().notEmpty().withMessage('Character name is required')
];

const removeCastValidator = [
    param('id').isMongoId().withMessage('Content ID is invalid'),
    param('castId').isMongoId().withMessage('Cast ID is invalid')
];

const contentIdRelationValidator = [
    param('id').isMongoId().withMessage('ID is invalid')
];

const genreIdRelationValidator = [
    param('genreId').isMongoId().withMessage('Genre ID is invalid')
];

const castIdRelationValidator = [
    param('castId').isMongoId().withMessage('Cast ID is invalid')
];

module.exports = {
    addGenresValidator,
    removeGenreValidator,
    addCastValidator,
    updateCastValidator,
    removeCastValidator,
    contentIdRelationValidator,
    genreIdRelationValidator,
    castIdRelationValidator
};
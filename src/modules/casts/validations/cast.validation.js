const { body, param } = require('express-validator');

const createCastValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Cast name is required')
        .isString().withMessage('Cast name must be a valid string'),
    
    body('image')
        .optional()
        .isString().withMessage('Image URL must be a string'),
    
    body('biography')
        .optional()
        .isString().withMessage('Biography must be a string')
];

const updateCastValidator = [
    param('id').isMongoId().withMessage('Invalid Cast ID format'),
    
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Cast name cannot be empty')
        .isString(),
    
    body('image')
        .optional()
        .isString(),
    
    body('biography')
        .optional()
        .isString()
];

const castIdValidator = [
    param('id').isMongoId().withMessage('Invalid Cast ID format')
];

module.exports = {
    createCastValidator,
    updateCastValidator,
    castIdValidator
};
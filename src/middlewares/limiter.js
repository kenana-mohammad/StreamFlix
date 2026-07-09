//
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    message: {
        error: 'Too many requests, please try again later.'
    }
})
const LoginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 15 minutes
    limit: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    message: {
        error: 'Too many requests, please try again later.'
    }
})

module.exports = { limiter, LoginLimiter }
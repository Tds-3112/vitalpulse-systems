const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Skip rate limiting in test environment
const skipInTest = () => env.isTest;

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please wait.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

module.exports = { generalLimiter, authLimiter, strictLimiter };

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, [], false);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors.length > 0 && { errors: error.errors }),
    ...(env.isDev && { stack: err.stack }),
  };

  // Log error
  if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} - ${error.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`${error.statusCode} - ${error.message} - ${req.originalUrl}`);
  }

  res.status(error.statusCode).json(response);
};

// Handle 404
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };

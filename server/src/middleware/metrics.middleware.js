const logger = require('../utils/logger');

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const responseTime = durationMs.toFixed(2);

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    };

    if (durationMs > 1000) {
      logger.warn(`Slow request: ${JSON.stringify(logData)}`);
    }
  });

  next();
};

module.exports = metricsMiddleware;

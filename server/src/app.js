const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const corsMiddleware = require('./config/cors');
const swaggerSpec = require('./config/swagger');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const metricsMiddleware = require('./middleware/metrics.middleware');
const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');
const routes = require('./routes');

const app = express();

// ========================
// Security Middleware
// ========================
app.use(helmet());
app.use(corsMiddleware);

// ========================
// Rate Limiting
// ========================
app.use('/api/', generalLimiter);

// ========================
// Body Parsing
// ========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========================
// Compression
// ========================
app.use(compression());

// ========================
// Logging
// ========================
app.use(morgan('combined', { stream: logger.stream }));
app.use(metricsMiddleware);

// ========================
// API Documentation
// ========================
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VitalPulse API Docs',
  })
);

// ========================
// API Routes
// ========================
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'VitalPulse Blood Bank API',
    docs: '/api/v1/docs',
    health: '/api/v1/health',
    version: '1.0.0',
  });
});

// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);

module.exports = app;

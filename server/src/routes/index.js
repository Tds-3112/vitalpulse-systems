const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cache = require('../services/cache.service');

// Import all route modules
const authRoutes = require('./auth.routes');
const inventoryRoutes = require('./inventory.routes');
const donationRoutes = require('./donation.routes');
const requestRoutes = require('./request.routes');
const userRoutes = require('./user.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/donations', donationRoutes);
router.use('/requests', requestRoutes);
router.use('/users', userRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200: { description: System status }
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: 'VitalPulse API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'N/A',
      },
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
      cache: cache.getStats(),
      version: '1.0.0',
    },
  };
  res.status(200).json(healthCheck);
});

module.exports = router;

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

const validateConnectionString = (uri) => {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Invalid MongoDB connection string');
  }
  if (!uri.startsWith('mongodb') && !uri.startsWith('mongodb+srv')) {
    throw new Error('Connection string must start with mongodb or mongodb+srv');
  }
  return true;
};

const connectWithRetry = async (uri, attempt = 1) => {
  try {
    validateConnectionString(uri);
    
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: env.isDev || env.isTest ? 3000 : 5000,
      socketTimeoutMS: 45000,
    });
    return conn;
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      throw err;
    }
    const delay = (env.isDev || env.isTest) ? 1000 : (RETRY_DELAYS[attempt - 1] || 8000);
    logger.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(uri, attempt + 1);
  }
};

const connectDB = async () => {
  try {
    let uri = env.MONGODB_URI;

    if (env.isDev || env.isTest) {
      try {
        await connectWithRetry(uri);
        logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      } catch (err) {
        logger.warn('Local MongoDB not available, starting in-memory MongoDB...');
        await mongoose.disconnect().catch(() => {});

        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();

        const conn = await connectWithRetry(uri);
        logger.info(`In-memory MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

        const seed = require('../seed');
        await seed();

        process.mongod = mongod;
        return conn;
      }
    }

    const conn = await connectWithRetry(uri);
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  logger.info(`MongoDB connected to ${mongoose.connection.host}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await mongoose.disconnect();
    if (process.mongod) {
      await process.mongod.stop();
    }
    logger.info('MongoDB disconnected');
    process.exit(0);
  } catch (err) {
    logger.error(`Shutdown error: ${err.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;

const Redis = require('ioredis');
const logger = require('../config/logger');

// For test environment, return mock client
if (process.env.NODE_ENV === 'test') {
  const mockRedis = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    zAdd: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn()
  };
  
  module.exports = {
    createClient: () => mockRedis,
    client: mockRedis
  };
} else {
  // Real Redis client for non-test environments
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.info(`Retrying Redis connection... Attempt ${times}`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true // Only connect when needed
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err.message);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis successfully');
  });

  client.on('ready', () => {
    logger.info('Redis client is ready');
  });

  // Test the connection
  (async () => {
    try {
      await client.ping();
      logger.info('Redis connection test successful');
    } catch (error) {
      logger.error('Redis connection test failed:', error.message);
      logger.info('Redis connection details:', {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      });
    }
  })();

  module.exports = {
    createClient: () => client,
    client
  };
} 
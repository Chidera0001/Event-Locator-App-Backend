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
    password: process.env.REDIS_PASSWORD
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  // Connect to Redis
  (async () => {
    await client.connect();
  })();

  module.exports = {
    createClient: () => client,
    client
  };
} 
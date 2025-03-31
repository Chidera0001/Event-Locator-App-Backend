const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

if (process.env.NODE_ENV === 'test') {
  // Use mock implementation for testing
  redisClient = new Redis({
    host: 'localhost',
    port: 6379,
    lazyConnect: true, // Don't try to connect immediately
    enableOfflineQueue: false
  });

  // Mock Redis methods
  redisClient.connect = jest.fn().mockResolvedValue();
  redisClient.quit = jest.fn().mockResolvedValue();
  redisClient.set = jest.fn().mockResolvedValue('OK');
  redisClient.get = jest.fn().mockResolvedValue(null);
} else {
  // Real Redis client for development/production
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  });
}

module.exports = redisClient; 
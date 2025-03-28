const redis = require('redis');
const logger = require('../config/logger');

// Create Redis client
const client = redis.createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
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

module.exports = client; 
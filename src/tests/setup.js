const sequelize = require('../config/database');
const logger = require('../config/logger');

beforeAll(async () => {
  // Ensure we're using test database
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must be run in test environment');
  }
  
  if (!process.env.DB_NAME.includes('test')) {
    throw new Error('Tests must use test database');
  }

  try {
    // Create extensions
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');

    // Sync database
    await sequelize.sync({ force: true });
    logger.info('Test database synchronized');
  } catch (error) {
    logger.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
}); 
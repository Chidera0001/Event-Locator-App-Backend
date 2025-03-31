const { Pool } = require('pg');
const logger = require('./logger');

// Make sure dotenv is loaded
require('dotenv').config();

logger.debug('Database connection config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // Don't log password
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
});

// Test the connection
pool.on('connect', () => {
  logger.info('Database connected successfully:', {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  });
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Export a function to test the connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database() as db_name');
    logger.info('Connected to database:', result.rows[0].db_name);
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection }; 
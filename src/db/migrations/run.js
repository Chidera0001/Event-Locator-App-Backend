require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    
    // Log connection info for debugging (remove this in production)
    console.log(`Connecting with user: ${process.env.DB_USER}`);
    
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await query(initSql);
    
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations; 
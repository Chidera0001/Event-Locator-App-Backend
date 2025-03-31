require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');

    // Create extensions if they don't exist
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');

    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, 'create_user_preferences.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    logger.info('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration; 
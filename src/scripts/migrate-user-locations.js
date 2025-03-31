const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

async function migrateUserLocations() {
  try {
    const sqlPath = path.join(__dirname, '../migrations/update_user_locations.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    await pool.query(sql);
    logger.info('User locations table updated successfully');
  } catch (error) {
    logger.error('Error updating user locations table:', error);
    throw error;
  }
}

if (require.main === module) {
  migrateUserLocations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUserLocations; 
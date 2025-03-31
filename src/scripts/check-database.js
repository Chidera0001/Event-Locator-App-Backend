const { pool } = require('../config/database');
const logger = require('../config/logger');

async function checkDatabase() {
  try {
    // Check current database
    const dbResult = await pool.query('SELECT current_database()');
    logger.info('Current database:', dbResult.rows[0].current_database);

    // Check all databases
    const allDbResult = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false;
    `);
    logger.info('Available databases:', allDbResult.rows.map(row => row.datname));

    // Check users table in current database
    const usersResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users;
    `);
    logger.info('Users in current database:', usersResult.rows[0].count);

  } catch (error) {
    logger.error('Database check error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase(); 
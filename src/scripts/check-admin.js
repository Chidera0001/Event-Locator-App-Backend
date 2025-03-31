const { pool } = require('../config/database');
const logger = require('../config/logger');

async function checkAdmin() {
  try {
    // First check if admin exists
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        role, 
        status, 
        password_hash IS NOT NULL as has_password,
        created_at,
        LENGTH(password_hash) as pass_length
      FROM users 
      WHERE email = $1
    `, ['admin@example.com']);

    if (result.rows[0]) {
      const admin = result.rows[0];
      logger.info('Admin user found:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        hasPassword: admin.has_password,
        passwordLength: admin.pass_length,
        createdAt: admin.created_at
      });

      // Check table structure
      const tableInfo = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);

      logger.info('Users table structure:', tableInfo.rows);

    } else {
      logger.info('No admin user found in database');
      
      // Check if users table exists and has records
      const tableCount = await pool.query(`
        SELECT COUNT(*) as count FROM users;
      `);
      
      logger.info('Total users in database:', tableCount.rows[0].count);
    }
  } catch (error) {
    logger.error('Error checking admin:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkAdmin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to check admin:', error);
      process.exit(1);
    });
}

module.exports = checkAdmin; 
const { pool } = require('../config/database');
const logger = require('../config/logger');

async function checkUsers() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        username,
        role, 
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    logger.info('Total users found:', result.rows.length);
    
    result.rows.forEach(user => {
      logger.info('User:', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      });
    });

  } catch (error) {
    logger.error('Error checking users:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to check users:', error);
      process.exit(1);
    });
}

module.exports = checkUsers; 
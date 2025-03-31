const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

async function resetAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete existing admin
    await client.query(
      'DELETE FROM users WHERE email = $1',
      ['admin@example.com']
    );

    // Create new admin user
    const password = process.env.ADMIN_PASSWORD || 'SecureAdminPass123!';
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    logger.debug('Creating admin with:', {
      email: 'admin@example.com',
      hashLength: password_hash.length
    });

    const result = await client.query(
      `INSERT INTO users (
        id,
        username,
        email,
        password_hash,
        role,
        status,
        preferred_language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role`,
      [
        id,
        'admin',
        'admin@example.com',
        password_hash,
        'admin',
        'active',
        'en'
      ]
    );

    await client.query('COMMIT');

    logger.info('Admin user reset successfully:', {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error resetting admin:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  resetAdmin()
    .then(() => {
      logger.info('Admin reset complete');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Failed to reset admin:', error);
      process.exit(1);
    });
}

module.exports = resetAdmin; 
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if admin exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (checkResult.rows.length > 0) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const password = process.env.ADMIN_PASSWORD || 'SecureAdminPass123!';
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

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

    logger.info('Admin user created successfully:', {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating admin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createAdmin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to create admin:', error);
      process.exit(1);
    });
}

module.exports = createAdmin; 
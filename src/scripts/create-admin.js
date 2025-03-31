require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function createAdmin() {
  const adminUser = {
    username: 'admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
  };

  try {
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [adminUser.username, adminUser.email, hashedPassword, adminUser.role]
    );
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Failed to create admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdmin(); 
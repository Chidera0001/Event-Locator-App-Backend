const db = require('../config/database');
const bcrypt = require('bcrypt');

const UserModel = {
  async create({ username, email, password, language = 'en' }) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, password_hash, language)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, language, created_at
    `;
    
    const result = await db.query(query, [username, email, passwordHash, language]);
    return result.rows[0];
  },
  
  async findById(id) {
    const query = `
      SELECT id, username, email, language, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },
  
  async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, language, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  },
  
  async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, language, created_at, updated_at
      FROM users
      WHERE username = $1
    `;
    
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  },
  
  async updateProfile(id, { username, email, language }) {
    const query = `
      UPDATE users
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          language = COALESCE($3, language),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, language, created_at, updated_at
    `;
    
    const result = await db.query(query, [username, email, language, id]);
    return result.rows[0];
  },
  
  async updatePassword(id, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      UPDATE users
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [passwordHash, id]);
    return result.rows[0];
  }
};

module.exports = UserModel; 
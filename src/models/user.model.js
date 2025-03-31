const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.preferred_language = data.preferred_language;
    this.role = data.role;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByUsername(username) {
    const query = `
      SELECT * FROM users WHERE username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findByEmail(email) {
    const query = `
      SELECT * FROM users WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, role, preferred_language, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async create({ username, email, password, language = 'en', role = 'user' }) {
    try {
      logger.debug('Creating new user:', { username, email, role });
      
      // Log password hash details
      const password_hash = await bcrypt.hash(password, 10);
      logger.debug('Password hash created:', {
        hashLength: password_hash.length,
        originalPasswordLength: password.length
      });

      const id = uuidv4();

      const result = await pool.query(
        `INSERT INTO users (
          id, username, email, password_hash, 
          preferred_language, role, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [id, username, email, password_hash, language, role, 'active']
      );

      logger.debug('User created successfully:', {
        id: result.rows[0].id,
        hasPasswordHash: !!result.rows[0].password_hash,
        passwordHashLength: result.rows[0].password_hash?.length
      });
      
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error creating user:', error.message);
      throw error;
    }
  }

  async update(data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && !['id', 'created_at'].includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return this;

    values.push(this.id);
    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return new User(result.rows[0]);
  }

  async updatePassword(newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [password_hash, this.id]);
    return result.rows[0];
  }

  async delete() {
    await pool.query('DELETE FROM users WHERE id = $1', [this.id]);
  }

  toJSON() {
    const user = { ...this };
    delete user.password_hash;
    return user;
  }

  async verifyPassword(password) {
    try {
      logger.debug('Verifying password:', {
        hasPasswordHash: !!this.password_hash,
        passwordHashLength: this.password_hash?.length,
        providedPasswordLength: password?.length
      });
      
      const isValid = await bcrypt.compare(password, this.password_hash);
      logger.debug('Password verification result:', isValid);
      
      return isValid;
    } catch (error) {
      logger.error('Password verification error:', error.message);
      throw error;
    }
  }

  static async findAll() {
    try {
      logger.debug('Finding all users');
      
      const result = await pool.query(`
        SELECT 
          id,
          username,
          email,
          role,
          status,
          preferred_language,
          created_at,
          updated_at
        FROM users
        ORDER BY created_at DESC
      `);
      
      logger.debug(`Found ${result.rows.length} users`);
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      logger.error('Error finding all users:', error.message);
      throw error;
    }
  }

  async updateProfile(userData) {
    const { username, email, preferred_language } = userData;
    const query = `
      UPDATE users 
      SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        preferred_language = COALESCE($3, preferred_language),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, role, preferred_language, created_at, updated_at
    `;
    
    const result = await pool.query(query, [username, email, preferred_language, this.id]);
    return new User(result.rows[0]);
  }
}

module.exports = User; 
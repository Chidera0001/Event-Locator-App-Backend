const { pool } = require('../config/database');
const logger = require('../config/logger');

const CategoryModel = {
  async getAllCategories() {
    const query = `
      SELECT id, name, created_at
      FROM categories
      ORDER BY name
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getCategoryById(id) {
    const query = `
      SELECT id, name, created_at
      FROM categories
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async setUserPreferences(userId, categoryIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing preferences
      await client.query(
        'DELETE FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      if (categoryIds && categoryIds.length > 0) {
        // Verify all categories exist
        const existingCategories = await client.query(
          'SELECT id FROM categories WHERE id = ANY($1::uuid[])',
          [categoryIds]
        );

        if (existingCategories.rows.length !== categoryIds.length) {
          throw new Error('Some category IDs are invalid');
        }

        // Insert new preferences
        const values = categoryIds.map(categoryId => ({
          userId,
          categoryId
        }));

        const insertQuery = `
          INSERT INTO user_preferences (user_id, category_id)
          VALUES ($1, $2)
          RETURNING id, user_id, category_id, notification_radius, email_notifications
        `;

        const insertPromises = values.map(v => 
          client.query(insertQuery, [v.userId, v.categoryId])
        );
        
        const results = await Promise.all(insertPromises);
        await client.query('COMMIT');
        
        return results.map(r => r.rows[0]);
      }

      await client.query('COMMIT');
      return [];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error setting user preferences:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserPreferences(userId) {
    const query = `
      SELECT 
        up.id,
        up.user_id,
        up.category_id,
        up.notification_radius,
        up.email_notifications,
        c.name as category_name
      FROM user_preferences up
      JOIN categories c ON c.id = up.category_id
      WHERE up.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
};

module.exports = CategoryModel; 
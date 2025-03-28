const db = require('../config/database');

const CategoryModel = {
  async getAllCategories() {
    const query = `
      SELECT id, name, created_at, updated_at
      FROM categories
      ORDER BY name
    `;
    
    const result = await db.query(query);
    return result.rows;
  },
  
  async getCategoryById(id) {
    const query = `
      SELECT id, name, created_at, updated_at
      FROM categories
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },
  
  async getUserPreferences(userId) {
    const query = `
      SELECT c.id, c.name
      FROM categories c
      JOIN user_category_preferences ucp ON c.id = ucp.category_id
      WHERE ucp.user_id = $1
      ORDER BY c.name
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  },
  
  async setUserPreferences(userId, categoryIds) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Delete existing preferences
      const deleteQuery = `
        DELETE FROM user_category_preferences
        WHERE user_id = $1
      `;
      await client.query(deleteQuery, [userId]);
      
      // Insert new preferences
      if (categoryIds.length > 0) {
        const insertValues = categoryIds.map((_, index) => `($1, $${index + 2})`).join(', ');
        const insertQuery = `
          INSERT INTO user_category_preferences (user_id, category_id)
          VALUES ${insertValues}
        `;
        
        const insertParams = [userId, ...categoryIds];
        await client.query(insertQuery, insertParams);
      }
      
      await client.query('COMMIT');
      
      return this.getUserPreferences(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = CategoryModel; 
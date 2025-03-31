const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

async function seedCategories() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Sample categories
    const categories = [
      { name: 'Technology', id: uuidv4() },
      { name: 'Music', id: uuidv4() },
      { name: 'Sports', id: uuidv4() },
      { name: 'Food', id: uuidv4() }
    ];

    // Insert categories
    for (const category of categories) {
      await client.query(
        'INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [category.id, category.name]
      );
    }

    await client.query('COMMIT');
    
    // Get and log the inserted categories
    const result = await client.query('SELECT id, name FROM categories');
    logger.info('Seeded categories:', result.rows);
    
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      logger.info('Category seeding completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Category seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedCategories; 
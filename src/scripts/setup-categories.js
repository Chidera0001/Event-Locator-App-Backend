const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

async function setupCategories() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create categories table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sample categories with fixed UUIDs for testing
    const categories = [
      { 
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Technology'
      },
      { 
        id: '650e8400-e29b-41d4-a716-446655440001',
        name: 'Music'
      },
      { 
        id: '750e8400-e29b-41d4-a716-446655440002',
        name: 'Sports'
      }
    ];

    // Insert categories
    for (const category of categories) {
      await client.query(
        `INSERT INTO categories (id, name) 
         VALUES ($1, $2) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [category.id, category.name]
      );
    }

    await client.query('COMMIT');
    
    // Get and log the inserted categories
    const result = await client.query('SELECT id, name FROM categories');
    logger.info('Available categories:', result.rows);
    
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Category setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupCategories()
    .then(categories => {
      console.log('\nAvailable Categories:');
      console.table(categories);
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupCategories; 
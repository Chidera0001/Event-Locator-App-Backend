const { pool } = require('../config/database');
const logger = require('../config/logger');

async function verifyTables() {
  const client = await pool.connect();
  
  try {
    // Check if tables exist
    const tableChecks = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'categories', 'user_preferences');
    `);

    const existingTables = tableChecks.rows.map(row => row.table_name);
    logger.info('Existing tables:', existingTables);

    // Check user_preferences structure
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      ORDER BY ordinal_position;
    `);

    logger.info('user_preferences columns:', columnCheck.rows);

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'user_preferences';
    `);

    logger.info('user_preferences indexes:', indexCheck.rows);

    // Check if any categories exist
    const categoryCheck = await client.query('SELECT COUNT(*) FROM categories');
    logger.info('Number of categories:', categoryCheck.rows[0].count);

    return {
      tables: existingTables,
      columns: columnCheck.rows,
      indexes: indexCheck.rows,
      categoryCount: parseInt(categoryCheck.rows[0].count)
    };
  } catch (error) {
    logger.error('Verification failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  verifyTables()
    .then(result => {
      logger.info('Verification completed:', result);
      process.exit(0);
    })
    .catch(error => {
      logger.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = verifyTables; 
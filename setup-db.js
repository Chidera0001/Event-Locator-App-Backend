const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Direct database connection without using .env
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123456',
  database: 'event_locator',
  ssl: false
});

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Read the SQL file
    const initSql = fs.readFileSync(
      path.join(__dirname, 'src/db/migrations/init.sql'), 
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(initSql);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the connection
    pool.end();
  }
}

// Run the migrations
runMigrations(); 
const { pool } = require('../models');

async function resetTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('This script can only run in test environment');
  }

  try {
    console.log('Connecting to database...');
    
    // Test the connection first
    await pool.query('SELECT NOW()');
    
    console.log('Resetting test database...');
    
    // Fixed SQL syntax - removed IF EXISTS from TRUNCATE
    await pool.query(`
      DO $$ 
      BEGIN
        -- Drop tables if they exist
        DROP TABLE IF EXISTS 
          user_preferences,
          favorites,
          reviews,
          events,
          categories,
          users CASCADE;
          
        -- Recreate tables
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          location GEOGRAPHY(POINT),
          preferred_language VARCHAR(10) DEFAULT 'en',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          location GEOGRAPHY(POINT) NOT NULL,
          address TEXT NOT NULL,
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          category_id UUID REFERENCES categories(id),
          creator_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id),
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS favorites (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, event_id)
        );

        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
          notification_radius INTEGER DEFAULT 10000,
          email_notifications BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, category_id)
        );

      EXCEPTION 
        WHEN OTHERS THEN 
          RAISE NOTICE 'Error occurred: %', SQLERRM;
      END $$;
    `);
    
    console.log('Test database reset successful');
  } catch (error) {
    console.error('Database Error:', error.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    throw error;
  } finally {
    await pool.end().catch(console.error);
  }
}

if (require.main === module) {
  resetTestDatabase()
    .catch(error => {
      console.error('Failed to reset database:', error);
      process.exit(1);
    });
}

module.exports = resetTestDatabase; 
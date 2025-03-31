-- First drop the existing table if it exists
DROP TABLE IF EXISTS user_locations CASCADE;

-- Create the table with proper UUID and PostGIS support
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);

-- Create a spatial index on the location column
CREATE INDEX idx_user_locations_location ON user_locations USING GIST(location);

-- Add a unique constraint on user_id to ensure one location per user
ALTER TABLE user_locations ADD CONSTRAINT unique_user_location UNIQUE (user_id); 
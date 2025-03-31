const { pool } = require('../config/database');
const logger = require('../config/logger');

const LocationModel = {
  async setUserLocation(userId, { latitude, longitude, address }) {
    try {
      logger.debug('Setting user location:', { userId, latitude, longitude, address });

      // Use a transaction to ensure data consistency
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if user already has a location
        const checkQuery = `
          SELECT id FROM user_locations WHERE user_id = $1
        `;
        const checkResult = await client.query(checkQuery, [userId]);
        
        let result;
        if (checkResult.rows.length > 0) {
          // Update existing location
          const updateQuery = `
            UPDATE user_locations
            SET 
              location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              address = $3,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $4
            RETURNING 
              id,
              user_id,
              ST_X(location::geometry) as longitude,
              ST_Y(location::geometry) as latitude,
              address,
              updated_at
          `;
          result = await client.query(updateQuery, [latitude, longitude, address, userId]);
        } else {
          // Insert new location
          const insertQuery = `
            INSERT INTO user_locations (user_id, location, address)
            VALUES (
              $1,
              ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
              $4
            )
            RETURNING 
              id,
              user_id,
              ST_X(location::geometry) as longitude,
              ST_Y(location::geometry) as latitude,
              address,
              created_at
          `;
          result = await client.query(insertQuery, [userId, latitude, longitude, address]);
        }

        await client.query('COMMIT');
        logger.debug('Location operation successful:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error in setUserLocation:', error);
      throw error;
    }
  },
  
  async getUserLocation(userId) {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude,
          address,
          created_at,
          updated_at
        FROM user_locations
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error in getUserLocation:', error);
      throw error;
    }
  }
};

module.exports = LocationModel; 
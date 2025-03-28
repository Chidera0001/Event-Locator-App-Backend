const db = require('../config/database');

const LocationModel = {
  async setUserLocation(userId, { latitude, longitude, address }) {
    // First check if user already has a location
    const checkQuery = `
      SELECT id FROM user_locations WHERE user_id = $1
    `;
    const checkResult = await db.query(checkQuery, [userId]);
    
    let query;
    let params;
    
    if (checkResult.rows.length > 0) {
      // Update existing location
      query = `
        UPDATE user_locations
        SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            address = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4
        RETURNING id, user_id, 
                  ST_X(location::geometry) as longitude,
                  ST_Y(location::geometry) as latitude,
                  address, updated_at
      `;
      params = [longitude, latitude, address, userId];
    } else {
      // Insert new location
      query = `
        INSERT INTO user_locations (user_id, location, address)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4)
        RETURNING id, user_id, 
                  ST_X(location::geometry) as longitude,
                  ST_Y(location::geometry) as latitude,
                  address, created_at
      `;
      params = [userId, longitude, latitude, address];
    }
    
    const result = await db.query(query, params);
    return result.rows[0];
  },
  
  async getUserLocation(userId) {
    const query = `
      SELECT id, user_id, 
             ST_X(location::geometry) as longitude,
             ST_Y(location::geometry) as latitude,
             address, created_at, updated_at
      FROM user_locations
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }
};

module.exports = LocationModel; 
const db = require('../config/database');

const EventModel = {
  async createEvent({ title, description, latitude, longitude, address, startTime, endTime, createdBy }) {
    const query = `
      INSERT INTO events (
        title, description, location, address, start_time, end_time, created_by
      )
      VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, $8
      )
      RETURNING id, title, description, 
                ST_X(location::geometry) as longitude,
                ST_Y(location::geometry) as latitude,
                address, start_time, end_time, created_by, created_at
    `;
    
    const params = [
      title, description, longitude, latitude, address, startTime, endTime, createdBy
    ];
    
    const result = await db.query(query, params);
    return result.rows[0];
  },
  
  async getEvents({ limit = 20, offset = 0 }) {
    const query = `
      SELECT e.id, e.title, e.description, 
             ST_X(e.location::geometry) as longitude,
             ST_Y(e.location::geometry) as latitude,
             e.address, e.start_time, e.end_time, 
             e.created_by, e.created_at, e.updated_at,
             u.username as creator_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.start_time DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },
  
  async getEventById(id) {
    const query = `
      SELECT e.id, e.title, e.description, 
             ST_X(e.location::geometry) as longitude,
             ST_Y(e.location::geometry) as latitude,
             e.address, e.start_time, e.end_time, 
             e.created_by, e.created_at, e.updated_at,
             u.username as creator_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },
  
  async updateEvent(id, { title, description, latitude, longitude, address, startTime, endTime }) {
    const updateFields = [];
    const params = [id];
    let paramIndex = 2;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    
    if (latitude !== undefined && longitude !== undefined) {
      updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography`);
      params.push(longitude, latitude);
      paramIndex += 2;
    }
    
    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      params.push(address);
    }
    
    if (startTime !== undefined) {
      updateFields.push(`start_time = $${paramIndex++}`);
      params.push(startTime);
    }
    
    if (endTime !== undefined) {
      updateFields.push(`end_time = $${paramIndex++}`);
      params.push(endTime);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE events
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING id, title, description, 
                ST_X(location::geometry) as longitude,
                ST_Y(location::geometry) as latitude,
                address, start_time, end_time, created_by, updated_at
    `;
    
    const result = await db.query(query, params);
    return result.rows[0];
  },
  
  async deleteEvent(id) {
    const query = `
      DELETE FROM events
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },
  
  async findEventsByLocation(latitude, longitude, radius, { limit = 20, offset = 0 }) {
    const query = `
      SELECT e.id, e.title, e.description, 
             ST_X(e.location::geometry) as longitude,
             ST_Y(e.location::geometry) as latitude,
             e.address, e.start_time, e.end_time, 
             e.created_by, e.created_at, e.updated_at,
             u.username as creator_name,
             ST_Distance(
               e.location, 
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
             ) / 1000 as distance_km
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE ST_DWithin(
        e.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3 * 1000  -- Convert km to meters
      )
      ORDER BY distance_km ASC, e.start_time ASC
      LIMIT $4 OFFSET $5
    `;
    
    const params = [longitude, latitude, radius, limit, offset];
    const result = await db.query(query, params);
    return result.rows;
  },
  
  async setEventCategories(eventId, categoryIds) {
    // Start a transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Delete existing categories
      const deleteQuery = `
        DELETE FROM event_categories
        WHERE event_id = $1
      `;
      await client.query(deleteQuery, [eventId]);
      
      // Insert new categories
      if (categoryIds.length > 0) {
        const insertValues = categoryIds.map((_, index) => `($1, $${index + 2})`).join(', ');
        const insertQuery = `
          INSERT INTO event_categories (event_id, category_id)
          VALUES ${insertValues}
        `;
        
        const insertParams = [eventId, ...categoryIds];
        await client.query(insertQuery, insertParams);
      }
      
      await client.query('COMMIT');
      
      return this.getEventCategories(eventId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  async getEventCategories(eventId) {
    const query = `
      SELECT c.id, c.name
      FROM categories c
      JOIN event_categories ec ON c.id = ec.category_id
      WHERE ec.event_id = $1
      ORDER BY c.name
    `;
    
    const result = await db.query(query, [eventId]);
    return result.rows;
  },
  
  async findEventsByCategory(categoryId, { limit = 20, offset = 0 }) {
    const query = `
      SELECT e.id, e.title, e.description, 
             ST_X(e.location::geometry) as longitude,
             ST_Y(e.location::geometry) as latitude,
             e.address, e.start_time, e.end_time, 
             e.created_by, e.created_at, e.updated_at,
             u.username as creator_name
      FROM events e
      JOIN event_categories ec ON e.id = ec.event_id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE ec.category_id = $1
      ORDER BY e.start_time DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [categoryId, limit, offset]);
    return result.rows;
  },
  
  async addFavorite(userId, eventId) {
    const query = `
      INSERT INTO user_favorite_events (user_id, event_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, event_id) DO NOTHING
      RETURNING id
    `;
    
    const result = await db.query(query, [userId, eventId]);
    return result.rows[0];
  },
  
  async removeFavorite(userId, eventId) {
    const query = `
      DELETE FROM user_favorite_events
      WHERE user_id = $1 AND event_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [userId, eventId]);
    return result.rows[0];
  },
  
  async getUserFavorites(userId, { limit = 20, offset = 0 }) {
    const query = `
      SELECT e.id, e.title, e.description, 
             ST_X(e.location::geometry) as longitude,
             ST_Y(e.location::geometry) as latitude,
             e.address, e.start_time, e.end_time, 
             e.created_by, e.created_at, e.updated_at,
             u.username as creator_name,
             ufe.created_at as favorited_at
      FROM events e
      JOIN user_favorite_events ufe ON e.id = ufe.event_id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE ufe.user_id = $1
      ORDER BY ufe.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  },
  
  async addReview(eventId, userId, { rating, review }) {
    const query = `
      INSERT INTO event_reviews (event_id, user_id, rating, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET rating = $3, review = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING id, event_id, user_id, rating, review, created_at, updated_at
    `;
    
    const result = await db.query(query, [eventId, userId, rating, review]);
    return result.rows[0];
  },
  
  async getEventReviews(eventId, { limit = 20, offset = 0 }) {
    const query = `
      SELECT er.id, er.event_id, er.user_id, er.rating, er.review, 
             er.created_at, er.updated_at, u.username
      FROM event_reviews er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [eventId, limit, offset]);
    return result.rows;
  },
  
  async getAverageRating(eventId) {
    const query = `
      SELECT AVG(rating) as average_rating, COUNT(*) as review_count
      FROM event_reviews
      WHERE event_id = $1
    `;
    
    const result = await db.query(query, [eventId]);
    return result.rows[0];
  }
};

module.exports = EventModel; 
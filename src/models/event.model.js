const db = require('../config/database');

const EventModel = (pool) => {
  return {
    async create(eventData) {
      const query = `
        INSERT INTO events (
          title, description, location, address, 
          start_date, end_date, category_id, creator_id
        )
        VALUES (
          $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, 
          $6, $7, $8, $9
        )
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        eventData.title,
        eventData.description,
        eventData.location.coordinates[0],
        eventData.location.coordinates[1],
        eventData.address,
        eventData.startDate,
        eventData.endDate,
        eventData.categoryId,
        eventData.creatorId
      ]);
      return result.rows[0];
    },

    async findNearby(lat, lng, radius) {
      const query = `
        SELECT 
          id, title, description,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude,
          address, start_date, end_date,
          ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
          ) as distance
        FROM events
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3
        )
        ORDER BY distance
      `;
      
      const result = await pool.query(query, [lng, lat, radius]);
      return result.rows;
    },

    async getEvents({ limit = 20, offset = 0 }) {
      const query = `
        SELECT e.id, e.title, e.description, 
               ST_X(e.location::geometry) as longitude,
               ST_Y(e.location::geometry) as latitude,
               e.address, e.start_date, e.end_date, 
               e.category_id, e.creator_id, e.created_at, e.updated_at,
               u.username as creator_name
        FROM events e
        LEFT JOIN users u ON e.creator_id = u.id
        ORDER BY e.start_date DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    },
    
    async getEventById(id) {
      const query = `
        SELECT e.id, e.title, e.description, 
               ST_X(e.location::geometry) as longitude,
               ST_Y(e.location::geometry) as latitude,
               e.address, e.start_date, e.end_date, 
               e.category_id, e.creator_id, e.created_at, e.updated_at,
               u.username as creator_name
        FROM events e
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE e.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    },
    
    async updateEvent(id, { title, description, latitude, longitude, address, startDate, endDate }) {
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
      
      if (startDate !== undefined) {
        updateFields.push(`start_date = $${paramIndex++}`);
        params.push(startDate);
      }
      
      if (endDate !== undefined) {
        updateFields.push(`end_date = $${paramIndex++}`);
        params.push(endDate);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      const query = `
        UPDATE events
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING id, title, description, 
                  ST_X(location::geometry) as longitude,
                  ST_Y(location::geometry) as latitude,
                  address, start_date, end_date, 
                  category_id, creator_id, updated_at
      `;
      
      const result = await pool.query(query, params);
      return result.rows[0];
    },
    
    async deleteEvent(id) {
      const query = `
        DELETE FROM events
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    },
    
    async findEventsByLocation(latitude, longitude, radius, { limit = 20, offset = 0 }) {
      const query = `
        SELECT e.id, e.title, e.description, 
               ST_X(e.location::geometry) as longitude,
               ST_Y(e.location::geometry) as latitude,
               e.address, e.start_date, e.end_date, 
               e.category_id, e.creator_id, e.created_at, e.updated_at,
               u.username as creator_name,
               ST_Distance(
                 e.location, 
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
               ) / 1000 as distance_km
        FROM events e
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE ST_DWithin(
          e.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000  -- Convert km to meters
        )
        ORDER BY distance_km ASC, e.start_date ASC
        LIMIT $4 OFFSET $5
      `;
      
      const params = [longitude, latitude, radius, limit, offset];
      const result = await pool.query(query, params);
      return result.rows;
    },
    
    async setEventCategories(eventId, categoryIds) {
      // Start a transaction
      const client = await pool.getClient();
      
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
      
      const result = await pool.query(query, [eventId]);
      return result.rows;
    },
    
    async findEventsByCategory(categoryId, { limit = 20, offset = 0 }) {
      const query = `
        SELECT e.id, e.title, e.description, 
               ST_X(e.location::geometry) as longitude,
               ST_Y(e.location::geometry) as latitude,
               e.address, e.start_date, e.end_date, 
               e.category_id, e.creator_id, e.created_at, e.updated_at,
               u.username as creator_name
        FROM events e
        JOIN event_categories ec ON e.id = ec.event_id
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE ec.category_id = $1
        ORDER BY e.start_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [categoryId, limit, offset]);
      return result.rows;
    },
    
    async addFavorite(userId, eventId) {
      const query = `
        INSERT INTO user_favorite_events (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, eventId]);
      return result.rows[0];
    },
    
    async removeFavorite(userId, eventId) {
      const query = `
        DELETE FROM user_favorite_events
        WHERE user_id = $1 AND event_id = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, eventId]);
      return result.rows[0];
    },
    
    async getUserFavorites(userId, { limit = 20, offset = 0 }) {
      const query = `
        SELECT e.id, e.title, e.description, 
               ST_X(e.location::geometry) as longitude,
               ST_Y(e.location::geometry) as latitude,
               e.address, e.start_date, e.end_date, 
               e.category_id, e.creator_id, e.created_at, e.updated_at,
               u.username as creator_name,
               ufe.created_at as favorited_at
        FROM events e
        JOIN user_favorite_events ufe ON e.id = ufe.event_id
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE ufe.user_id = $1
        ORDER BY ufe.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [userId, limit, offset]);
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
      
      const result = await pool.query(query, [eventId, userId, rating, review]);
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
      
      const result = await pool.query(query, [eventId, limit, offset]);
      return result.rows;
    },
    
    async getAverageRating(eventId) {
      const query = `
        SELECT AVG(rating) as average_rating, COUNT(*) as review_count
        FROM event_reviews
        WHERE event_id = $1
      `;
      
      const result = await pool.query(query, [eventId]);
      return result.rows[0];
    },

    async findById(id) {
      const query = `
        SELECT *, 
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude
        FROM events
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    },

    async findByCategory(categoryId) {
      const query = `
        SELECT *,
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude
        FROM events
        WHERE category_id = $1
      `;
      const result = await pool.query(query, [categoryId]);
      return result.rows;
    },

    async update(id, updates) {
      const query = `
        UPDATE events
        SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        updates.title,
        updates.description,
        id
      ]);
      return result.rows[0];
    },

    async delete(id) {
      const query = `
        DELETE FROM events
        WHERE id = $1
      `;
      await pool.query(query, [id]);
    }
  };
};

module.exports = EventModel; 
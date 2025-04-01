const { Pool } = require('pg');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

// Create the event model instance directly instead of returning a factory function
const eventModel = {
  async createEvent(eventData) {
    try {
      logger.debug('Creating event with data:', eventData);
      
      const result = await pool.query(`
        INSERT INTO events (
          id, 
          title, 
          description, 
          location, 
          address, 
          start_date, 
          end_date, 
          creator_id
        ) VALUES (
          $1, 
          $2, 
          $3, 
          ST_SetSRID(ST_MakePoint($4, $5), 4326), 
          $6, 
          $7, 
          $8, 
          $9
        ) RETURNING *`,
        [
          eventData.id,
        eventData.title,
        eventData.description,
          eventData.location.coordinates[0], // longitude
          eventData.location.coordinates[1], // latitude
        eventData.address,
          new Date(eventData.start_date), // Convert to Date object
          eventData.end_date ? new Date(eventData.end_date) : null,
          eventData.creator_id
        ]
      );

      logger.debug('Event created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new Error(`Error creating event: ${error.message}`);
    }
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

  async getEvents(options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      const result = await pool.query(
        `SELECT * FROM events
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting events: ${error.message}`);
    }
    },
    
    async getEventById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting event by ID:', error);
      throw error;
    }
  },
  
  async updateEvent(id, eventData) {
    try {
      // Extract categories before updating event
      const categories = eventData.categories;
      delete eventData.categories; // Remove categories from eventData

      // Map camelCase to snake_case
      const fieldMappings = {
        title: 'title',
        description: 'description',
        location: 'location',
        address: 'address',
        startDate: 'start_date',
        endDate: 'end_date'
      };

      const updates = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query with proper field names
      for (const [camelKey, value] of Object.entries(eventData)) {
        const snakeKey = fieldMappings[camelKey];
        if (value !== undefined && snakeKey && !['id', 'creator_id', 'created_at'].includes(snakeKey)) {
          if (camelKey === 'location') {
            // Handle location update separately
            updates.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
            values.push(value.coordinates[0], value.coordinates[1]); // longitude, latitude
            paramCount += 2;
          } else if (camelKey === 'startDate' || camelKey === 'endDate') {
            // Handle date fields
            updates.push(`${snakeKey} = $${paramCount}`);
            values.push(new Date(value));
            paramCount++;
          } else {
            updates.push(`${snakeKey} = $${paramCount}`);
            values.push(value);
            paramCount++;
          }
        }
      }

      if (updates.length === 0 && !categories) {
        const event = await this.getEventById(id);
        return event;
      }

      // Start transaction
      await pool.query('BEGIN');

      try {
        // Update event details
        values.push(id);
        const eventQuery = `
          UPDATE events 
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $${paramCount}
          RETURNING *,
            ST_X(location::geometry) as longitude,
            ST_Y(location::geometry) as latitude
        `;

        logger.debug('Update event query:', { query: eventQuery, values });
        const eventResult = await pool.query(eventQuery, values);
        const updatedEvent = eventResult.rows[0];

        // Update categories if provided
        if (categories) {
          await this.setEventCategories(id, categories);
        }

        await pool.query('COMMIT');

        // Get updated event with categories
        const finalEvent = await this.getEventById(id);
        const eventCategories = await this.getEventCategories(id);
        
        return {
          ...finalEvent,
          categories: eventCategories
        };

      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
    },
    
    async deleteEvent(id) {
    try {
      await pool.query('DELETE FROM events WHERE id = $1', [id]);
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  },
  
  async findEventsByLocation(latitude, longitude, radius, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      const result = await pool.query(
        `SELECT 
          e.*,
               ST_Distance(
            location::geography,
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) as distance
        FROM events e
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000  -- Convert km to meters
        )
        ORDER BY distance
        LIMIT $4 OFFSET $5`,
        [longitude, latitude, radius, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding events by location: ${error.message}`);
    }
    },
    
    async setEventCategories(eventId, categoryIds) {
    try {
      await pool.query('BEGIN');
      
      // Delete existing categories
      await pool.query(
        'DELETE FROM event_categories WHERE event_id = $1',
        [eventId]
      );
      
      // Insert new categories if any
      if (categoryIds && categoryIds.length > 0) {
        // First verify that all categories exist
        const verifyQuery = `
          SELECT id FROM categories 
          WHERE id = ANY($1::uuid[])
        `;
        const verifyResult = await pool.query(verifyQuery, [categoryIds]);
        
        // Get the valid category IDs that actually exist
        const validCategoryIds = verifyResult.rows.map(row => row.id);
        
        if (validCategoryIds.length > 0) {
          const values = validCategoryIds.map((_, index) => `($1, $${index + 2})`).join(', ');
          const query = `
            INSERT INTO event_categories (event_id, category_id)
            VALUES ${values}
          `;
          
          await pool.query(query, [eventId, ...validCategoryIds]);
        } else {
          logger.warn('No valid category IDs found among:', categoryIds);
        }
      }
      
      await pool.query('COMMIT');
        
        return this.getEventCategories(eventId);
      } catch (error) {
      await pool.query('ROLLBACK');
      logger.error('Error setting event categories:', error);
      // Instead of throwing, return empty array for categories
      return [];
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
        INSERT INTO favorites (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
        RETURNING user_id, event_id, created_at
      `;
      
      const result = await pool.query(query, [userId, eventId]);
      return result.rows[0];
    },
    
    async removeFavorite(userId, eventId) {
      const query = `
        DELETE FROM favorites
        WHERE user_id = $1 AND event_id = $2
        RETURNING user_id, event_id, created_at
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
               f.created_at as favorited_at
        FROM events e
        JOIN favorites f ON e.id = f.event_id
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    },
    
    async addReview(eventId, userId, { rating, review }) {
      // First check if user has already reviewed this event
      const existingReview = await pool.query(
        'SELECT id FROM event_reviews WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );

      let query;
      let values;

      if (existingReview.rows.length > 0) {
        // Update existing review
        query = `
          UPDATE event_reviews 
          SET rating = $1, comment = $2
          WHERE event_id = $3 AND user_id = $4
          RETURNING id, event_id, user_id, rating, comment, created_at
        `;
        values = [rating, review, eventId, userId];
      } else {
        // Insert new review
        query = `
          INSERT INTO event_reviews (event_id, user_id, rating, comment)
          VALUES ($1, $2, $3, $4)
          RETURNING id, event_id, user_id, rating, comment, created_at
        `;
        values = [eventId, userId, rating, review];
      }
      
      const result = await pool.query(query, values);
      return result.rows[0];
    },
    
    async getEventReviews(eventId, { limit = 20, offset = 0 }) {
      const query = `
        SELECT er.id, er.event_id, er.user_id, er.rating, er.comment, 
               er.created_at, u.username
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
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE events 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  async getAllEvents() {
    const result = await pool.query(
      `SELECT 
        e.*,
        u.username as creator_name,
        ST_X(e.location::geometry) as longitude,
        ST_Y(e.location::geometry) as latitude
       FROM events e
       JOIN users u ON e.creator_id = u.id
       ORDER BY e.created_at DESC`
    );
    return result.rows;
  }
};

module.exports = eventModel; 
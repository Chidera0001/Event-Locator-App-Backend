const { pool } = require('../config/database');

const AnalyticsService = {
  async getUserAnalytics() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);
    return result.rows[0];
  },

  async getEventAnalytics() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN start_date >= NOW() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_events_30d,
        AVG(
          CASE WHEN reviews.rating IS NOT NULL 
          THEN reviews.rating 
          ELSE NULL END
        )::numeric(10,2) as avg_rating
      FROM events
      LEFT JOIN reviews ON events.id = reviews.event_id
    `);
    return result.rows[0];
  }
};

module.exports = AnalyticsService; 
const ReviewModel = (pool) => {
  return {
    async create({ userId, eventId, rating, comment }) {
      const query = `
        INSERT INTO reviews (user_id, event_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, event_id, rating, comment, created_at
      `;
      
      const result = await pool.query(query, [userId, eventId, rating, comment]);
      return result.rows[0];
    },

    async findByEventId(eventId) {
      const query = `
        SELECT r.*, u.username
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_id = $1
        ORDER BY r.created_at DESC
      `;
      
      const result = await pool.query(query, [eventId]);
      return result.rows;
    }
  };
};

module.exports = ReviewModel; 
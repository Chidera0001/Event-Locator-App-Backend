const FavoriteModel = (pool) => {
  return {
    async add(userId, eventId) {
      const query = `
        INSERT INTO favorites (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
        RETURNING user_id, event_id, created_at
      `;
      
      const result = await pool.query(query, [userId, eventId]);
      return result.rows[0];
    },

    async remove(userId, eventId) {
      const query = `
        DELETE FROM favorites
        WHERE user_id = $1 AND event_id = $2
      `;
      
      await pool.query(query, [userId, eventId]);
    },

    async getUserFavorites(userId) {
      const query = `
        SELECT e.*
        FROM favorites f
        JOIN events e ON e.id = f.event_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    }
  };
};

module.exports = FavoriteModel; 
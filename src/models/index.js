const { pool } = require('../config/database');

// Import models
const User = require('./user.model');
const Event = require('./event.model');
const Category = require('./category.model');
const Review = require('./review.model');
const Favorite = require('./favorite.model');

// Export models and pool
module.exports = {
  pool,
  User,
  Event,
  Category,
  Review,
  Favorite
}; 
const User = require('../models/user.model');
const locationModel = require('../models/location.model');
const categoryModel = require('../models/category.model');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

const UserService = {
  async getUserById(id) {
    return User.findById(id);
  },
  
  async getUserByEmail(email) {
    return User.findByEmail(email);
  },
  
  async updateProfile(id, userData) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return user.updateProfile(userData);
  },
  
  async updatePassword(id, currentPassword, newPassword) {
    const user = await User.findById(id);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('INVALID_PASSWORD');
    }
    
    return user.updatePassword(newPassword);
  },
  
  async setUserLocation(userId, locationData) {
    try {
      // First verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return await locationModel.setUserLocation(userId, locationData);
    } catch (error) {
      logger.error('Error in setUserLocation service:', error);
      throw error;
    }
  },
  
  async getUserLocation(userId) {
    try {
      // First verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return await locationModel.getUserLocation(userId);
    } catch (error) {
      logger.error('Error in getUserLocation service:', error);
      throw error;
    }
  },
  
  async setUserPreferences(userId, categoryIds) {
    return categoryModel.setUserPreferences(userId, categoryIds);
  },
  
  async getUserPreferences(userId) {
    return categoryModel.getUserPreferences(userId);
  },
  
  async getUsersByCategories(categoryIds) {
    // Get users interested in any of the categories
    const query = `
      SELECT DISTINCT u.id, u.username, u.email, u.language
      FROM users u
      JOIN user_category_preferences ucp ON u.id = ucp.user_id
      WHERE ucp.category_id = ANY($1::int[])
    `;
    
    const result = await db.query(query, [categoryIds]);
    return result.rows;
  }
};

module.exports = UserService; 
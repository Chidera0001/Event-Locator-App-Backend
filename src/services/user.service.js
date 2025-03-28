const userModel = require('../models/user.model');
const locationModel = require('../models/location.model');
const categoryModel = require('../models/category.model');

const UserService = {
  async getUserById(id) {
    return userModel.findById(id);
  },
  
  async getUserByEmail(email) {
    return userModel.findByEmail(email);
  },
  
  async updateProfile(id, userData) {
    return userModel.updateProfile(id, userData);
  },
  
  async updatePassword(id, currentPassword, newPassword) {
    const user = await userModel.findById(id);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('INVALID_PASSWORD');
    }
    
    return userModel.updatePassword(id, newPassword);
  },
  
  async setUserLocation(userId, locationData) {
    return locationModel.setUserLocation(userId, locationData);
  },
  
  async getUserLocation(userId) {
    return locationModel.getUserLocation(userId);
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
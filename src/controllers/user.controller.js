const userService = require('../services/user.service');
const logger = require('../config/logger');
const { body } = require('express-validator');

const UserController = {
  async getProfile(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  },
  
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { username, email, preferred_language } = req.body;

      const updatedUser = await userService.updateProfile(userId, {
        username,
        email,
        preferred_language
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      await userService.updatePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: req.t('passwordChanged', { ns: 'user' })
      });
    } catch (error) {
      if (error.message === 'INVALID_PASSWORD') {
        return res.status(400).json({
          success: false,
          message: req.t('invalidCredentials', { ns: 'error' })
        });
      }
      
      next(error);
    }
  },
  
  async updateLocation(req, res, next) {
    try {
      const { latitude, longitude, address } = req.body;
      const userId = req.user.id;
      
      logger.debug('Updating user location:', {
        userId,
        latitude,
        longitude,
        address
      });

      // Validate coordinates
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }
      
      const location = await userService.setUserLocation(userId, {
        latitude,
        longitude,
        address
      });
      
      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: { location }
      });
    } catch (error) {
      logger.error('Error updating location:', error);
      next(error);
    }
  },
  
  async getLocation(req, res, next) {
    try {
      const userId = req.user.id;
      const location = await userService.getUserLocation(userId);
      
      res.status(200).json({
        success: true,
        data: { location }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const { categories } = req.body;

      logger.debug('Updating user preferences:', {
        userId,
        categories
      });

      const preferences = await userService.setUserPreferences(userId, categories);

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences }
      });
    } catch (error) {
      logger.error('Error updating preferences:', error);
      next(error);
    }
  },
  
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = await userService.getUserPreferences(userId);

      res.status(200).json({
        success: true,
        data: { preferences }
      });
    } catch (error) {
      logger.error('Error getting preferences:', error);
      next(error);
    }
  },
  
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;
      
      const favorites = await userService.getUserFavorites(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: { favorites }
      });
    } catch (error) {
      next(error);
    }
  }
};

const preferencesValidation = [
  body('categories').isArray().withMessage('Categories must be an array'),
  body('categories.*').isUUID().withMessage('Each category must be a valid UUID')
];

module.exports = {
  ...UserController,
  preferencesValidation
}; 
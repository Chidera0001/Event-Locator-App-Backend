const userService = require('../services/user.service');

const UserController = {
  async getProfile(req, res) {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  },
  
  async updateProfile(req, res, next) {
    try {
      const { username, email, language } = req.body;
      const userId = req.user.id;
      
      const updatedUser = await userService.updateProfile(userId, {
        username,
        email,
        language
      });
      
      res.status(200).json({
        success: true,
        message: req.t('profileUpdated', { ns: 'user' }),
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
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: req.t('invalidLocation', { ns: 'error' })
        });
      }
      
      const location = await userService.setUserLocation(userId, {
        latitude,
        longitude,
        address
      });
      
      res.status(200).json({
        success: true,
        message: req.t('locationUpdated', { ns: 'user' }),
        data: { location }
      });
    } catch (error) {
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
      const { categories } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(categories)) {
        return res.status(400).json({
          success: false,
          message: req.t('missingFields', { ns: 'error' })
        });
      }
      
      const preferences = await userService.setUserPreferences(userId, categories);
      
      res.status(200).json({
        success: true,
        message: req.t('preferencesUpdated', { ns: 'user' }),
        data: { categories: preferences }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const categories = await userService.getUserPreferences(userId);
      
      res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (error) {
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

module.exports = UserController; 
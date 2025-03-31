const User = require('../models/user.model');
const EventService = require('../services/event.service');
const CategoryService = require('../services/category.service');
const logger = require('../config/logger');

const AdminController = {
  // User management
  async getAllUsers(req, res, next) {
    try {
      logger.debug('Getting all users');
      
      const users = await User.findAll();
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        preferred_language: user.preferred_language,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      res.status(200).json({
        success: true,
        data: { users: sanitizedUsers }
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      next(error);
    }
  },

  async getUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.updateRole(role);

      res.status(200).json({
        success: true,
        message: 'User role updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.updateStatus(status);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.delete();
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Event management
  async getAllEvents(req, res, next) {
    try {
      const events = await EventService.getAllEvents();
      res.json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateEventStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const event = await EventService.updateEventStatus(id, status);
      res.json({
        success: true,
        data: { event }
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteEvent(req, res, next) {
    try {
      await EventService.deleteEventAdmin(req.params.id);
      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Category management
  async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // System management
  async getSystemStats(req, res, next) {
    try {
      const stats = {
        totalUsers: await User.count(),
        totalEvents: await EventService.count(),
        // Add more stats as needed
      };
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSystemLogs(req, res, next) {
    try {
      const logs = await logger.getLogs();
      res.json({
        success: true,
        data: { logs }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AdminController; 
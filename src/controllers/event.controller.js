const eventService = require('../services/event.service');
const NotificationService = require('../services/notification.service');
const WebSocketServer = require('../websocket');
const logger = require('../config/logger');
const { isValidUUID } = require('../utils/validation');

const EventController = {
  async createEvent(req, res, next) {
    try {
      // Validate that required dates are present
      if (!req.body.startDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date is required'
        });
      }

      const eventData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        address: req.body.address,
        start_date: new Date(req.body.startDate).toISOString(), // Ensure proper date format
        end_date: req.body.endDate ? new Date(req.body.endDate).toISOString() : null,
        categories: req.body.categories
      };

      logger.debug('Creating event with data:', eventData);
      
      const event = await eventService.createEvent(eventData, req.user.id);
      
      // Schedule notifications
      await NotificationService.scheduleEventNotifications(event.id);
      
      // Send real-time update if WebSocket is available
      if (req.app.locals.wss && typeof req.app.locals.wss.notifyEventUpdate === 'function') {
        req.app.locals.wss.notifyEventUpdate(event.id, 'created', event);
      }
      
      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: { event }
      });
    } catch (error) {
      logger.error('Error creating event:', error);
      if (error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors || [{ message: error.message }]
        });
      }
      next(error);
    }
  },
  
  async getEvents(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const events = await eventService.getEvents({
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getEvent(req, res, next) {
    try {
      const { id } = req.params;
      
      const eventDetails = await eventService.getEventDetails(id);
      
      res.status(200).json({
        success: true,
        data: { event: eventDetails }
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: req.t('eventNotFound', { ns: 'event' })
        });
      }
      
      next(error);
    }
  },
  
  async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      logger.debug('Event update request:', {
        eventId: id,
        userId,
        isAdmin,
        updates: req.body
      });

      // Validate categories if provided
      if (req.body.categories) {
        const invalidUuids = req.body.categories.filter(categoryId => !isValidUUID(categoryId));
        if (invalidUuids.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category IDs provided',
            invalidIds: invalidUuids
          });
        }
      }

      const event = await eventService.updateEvent(id, req.body, userId, isAdmin);
      
      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      if (error.message === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this event'
        });
      }
      // Log the full error but send a cleaner message to the client
      logger.error('Error updating event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event. Please verify all category IDs are valid.'
      });
    }
  },
  
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      logger.debug('Event delete request:', {
        eventId: id,
        userId,
        isAdmin
      });

      await eventService.deleteEvent(id, userId, isAdmin);
      
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      if (error.message === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this event'
        });
      }
      next(error);
    }
  },
  
  async searchEventsByLocation(req, res, next) {
    try {
      const { latitude, longitude, radius, limit = 20, offset = 0 } = req.query;
      
      if (!latitude || !longitude || !radius) {
        return res.status(400).json({
          success: false,
          message: req.t('missingFields', { ns: 'error' })
        });
      }
      
      const events = await eventService.findEventsByLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      );
      
      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getEventsByCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const events = await eventService.findEventsByCategory(id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async addToFavorites(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await eventService.addToFavorites(userId, id);
      
      res.status(200).json({
        success: true,
        message: req.t('eventAddedToFavorites', { ns: 'event' })
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: req.t('eventNotFound', { ns: 'event' })
        });
      }
      
      next(error);
    }
  },
  
  async removeFromFavorites(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await eventService.removeFromFavorites(userId, id);
      
      res.status(200).json({
        success: true,
        message: req.t('eventRemovedFromFavorites', { ns: 'event' })
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;
      
      const events = await eventService.getUserFavorites(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: { events }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async addReview(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;
      const userId = req.user.id;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: req.t('missingFields', { ns: 'error' })
        });
      }
      
      const result = await eventService.addReview(id, userId, {
        rating: parseInt(rating),
        review
      });
      
      res.status(200).json({
        success: true,
        data: { review: result }
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: req.t('eventNotFound', { ns: 'event' })
        });
      }
      
      next(error);
    }
  },
  
  async getReviews(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const reviews = await eventService.getEventReviews(id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.status(200).json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      next(error);
    }
  },
  
  async getAllEvents(req, res, next) {
    try {
      const events = await eventService.getAllEvents();
      res.status(200).json({
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

      const event = await eventService.updateEventStatus(id, status);
      
      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      next(error);
    }
  },
  
  async deleteEventAdmin(req, res, next) {
    try {
      const { id } = req.params;
      await eventService.deleteEventAdmin(id);
      
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      next(error);
    }
  }
};

// Helper function to validate coordinates
function isValidCoordinates(lat, lng) {
  const validLat = !isNaN(lat) && lat >= -90 && lat <= 90;
  const validLng = !isNaN(lng) && lng >= -180 && lng <= 180;
  return validLat && validLng;
}

module.exports = EventController; 
const eventService = require('../services/event.service');
const NotificationService = require('../services/notification.service');
const WebSocketServer = require('../websocket');

const EventController = {
  async createEvent(req, res, next) {
    try {
      const {
        title,
        description,
        latitude,
        longitude,
        address,
        startTime,
        endTime,
        categories
      } = req.body;
      
      const userId = req.user.id;
      
      if (!title || !latitude || !longitude || !startTime) {
        return res.status(400).json({
          success: false,
          message: req.t('missingFields', { ns: 'error' })
        });
      }
      
      const event = await eventService.createEvent({
        title,
        description,
        latitude,
        longitude,
        address,
        startTime,
        endTime,
        categories
      }, userId);
      
      // Schedule notifications
      await NotificationService.scheduleEventNotifications(event.id);
      
      // Send real-time update
      req.app.locals.wss.notifyEventUpdate(event.id, 'created', event);
      
      res.status(201).json({
        success: true,
        message: req.t('eventCreated', { ns: 'event' }),
        data: { event }
      });
    } catch (error) {
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
      const {
        title,
        description,
        latitude,
        longitude,
        address,
        startTime,
        endTime,
        categories
      } = req.body;
      
      const userId = req.user.id;
      
      const event = await eventService.updateEvent(id, {
        title,
        description,
        latitude,
        longitude,
        address,
        startTime,
        endTime,
        categories
      }, userId);
      
      // Send real-time update
      req.app.locals.wss.notifyEventUpdate(id, 'updated', event);
      
      res.status(200).json({
        success: true,
        message: req.t('eventUpdated', { ns: 'event' }),
        data: { event }
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: req.t('eventNotFound', { ns: 'event' })
        });
      }
      
      if (error.message === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: req.t('unauthorized', { ns: 'error' })
        });
      }
      
      next(error);
    }
  },
  
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await eventService.deleteEvent(id, userId);
      
      // Send real-time update
      req.app.locals.wss.notifyEventUpdate(id, 'deleted', null);
      
      res.status(200).json({
        success: true,
        message: req.t('eventDeleted', { ns: 'event' })
      });
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: req.t('eventNotFound', { ns: 'event' })
        });
      }
      
      if (error.message === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: req.t('unauthorized', { ns: 'error' })
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
  }
};

module.exports = EventController; 
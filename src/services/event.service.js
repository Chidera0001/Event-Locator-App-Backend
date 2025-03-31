const eventModel = require('../models/event.model');
const notificationQueue = require('../queues/notification.queue');
const NotificationService = require('./notification.service');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const EventService = {
  async createEvent(eventData, userId) {
    try {
      // Create the event first
      const event = await eventModel.createEvent({
        ...eventData,
        creator_id: userId,
        id: uuidv4() // Generate a new UUID for the event
      });
      
      // Set categories if provided
      if (eventData.categories && eventData.categories.length > 0) {
        try {
          await eventModel.setEventCategories(event.id, eventData.categories);
        } catch (error) {
          logger.error('Error setting event categories:', error);
          // Continue even if categories fail - we can update them later
        }
      }
      
      // Schedule notifications if needed
      if (event.start_date) {
        await NotificationService.scheduleEventNotifications(event.id);
      }
      
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },
  
  async getEvents(options) {
    return eventModel.getEvents(options);
  },
  
  async getEventById(id) {
    return eventModel.getEventById(id);
  },
  
  async updateEvent(id, eventData, userId, isAdmin = false) {
    try {
      logger.debug('Updating event:', { id, userId, isAdmin, eventData });
      
      // Check if event exists
      const event = await eventModel.getEventById(id);
      
      if (!event) {
        logger.debug('Event not found:', id);
        throw new Error('EVENT_NOT_FOUND');
      }
      
      // Check authorization - allow if admin or creator
      if (!isAdmin && event.creator_id !== userId) {
        logger.debug('Unauthorized event update attempt:', {
          eventId: id,
          userId,
          creatorId: event.creator_id
        });
        throw new Error('UNAUTHORIZED');
      }

      // Transform dates if present
      const transformedData = {
        ...eventData,
        startDate: eventData.startDate ? new Date(eventData.startDate).toISOString() : undefined,
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString() : undefined
      };

      // Update the event
      const updatedEvent = await eventModel.updateEvent(id, transformedData);
      
      logger.debug('Event updated successfully:', id);
      return updatedEvent;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  },
  
  async deleteEvent(id, userId, isAdmin = false) {
    try {
      logger.debug('Deleting event:', { id, userId, isAdmin });
      
      const event = await eventModel.getEventById(id);
      
      if (!event) {
        logger.debug('Event not found:', id);
        throw new Error('EVENT_NOT_FOUND');
      }
      
      // Check authorization - allow if admin or creator
      if (!isAdmin && event.creator_id !== userId) {
        logger.debug('Unauthorized event deletion attempt:', {
          eventId: id,
          userId,
          creatorId: event.creator_id
        });
        throw new Error('UNAUTHORIZED');
      }

      await eventModel.deleteEvent(id);
      logger.debug('Event deleted successfully:', id);
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  },
  
  async findEventsByLocation(latitude, longitude, radius, options) {
    return eventModel.findEventsByLocation(latitude, longitude, radius, options);
  },
  
  async findEventsByCategory(categoryId, options) {
    return eventModel.findEventsByCategory(categoryId, options);
  },
  
  async getEventCategories(eventId) {
    return eventModel.getEventCategories(eventId);
  },
  
  async setEventCategories(eventId, categoryIds, userId) {
    // Check if user is the creator of the event
    const event = await eventModel.getEventById(eventId);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    if (event.created_by !== userId) {
      throw new Error('UNAUTHORIZED');
    }
    
    return eventModel.setEventCategories(eventId, categoryIds);
  },
  
  async addToFavorites(userId, eventId) {
    // Check if event exists
    const event = await eventModel.getEventById(eventId);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    return eventModel.addFavorite(userId, eventId);
  },
  
  async removeFromFavorites(userId, eventId) {
    return eventModel.removeFavorite(userId, eventId);
  },
  
  async getUserFavorites(userId, options) {
    return eventModel.getUserFavorites(userId, options);
  },
  
  async addReview(eventId, userId, reviewData) {
    // Check if event exists
    const event = await eventModel.getEventById(eventId);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    return eventModel.addReview(eventId, userId, reviewData);
  },
  
  async getEventReviews(eventId, options) {
    return eventModel.getEventReviews(eventId, options);
  },
  
  async getEventDetails(eventId) {
    // Get event basic info
    const event = await eventModel.getEventById(eventId);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    // Get event categories
    const categories = await eventModel.getEventCategories(eventId);
    
    // Get event ratings
    const ratings = await eventModel.getAverageRating(eventId);
    
    return {
      ...event,
      categories,
      rating: ratings.average_rating,
      reviewCount: ratings.review_count
    };
  },
  
  async deleteEventAdmin(id) {
    // Admin can delete any event without creator check
    const event = await eventModel.getEventById(id);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    return eventModel.deleteEvent(id);
  },
  
  async updateEventStatus(id, status) {
    const event = await eventModel.getEventById(id);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    return eventModel.updateStatus(id, status);
  },
  
  async getAllEvents() {
    return eventModel.getAllEvents();
  }
};

module.exports = EventService; 
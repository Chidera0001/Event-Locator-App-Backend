const eventModel = require('../models/event.model');
const notificationQueue = require('../queues/notification.queue');

const EventService = {
  async createEvent(eventData, userId) {
    // Create the event
    const event = await eventModel.createEvent({
      ...eventData,
      createdBy: userId
    });
    
    // Set event categories if provided
    if (eventData.categories && eventData.categories.length > 0) {
      await eventModel.setEventCategories(event.id, eventData.categories);
    }
    
    // Add event to notification queue if it's in the future
    const eventTime = new Date(event.start_time);
    const now = new Date();
    
    if (eventTime > now) {
      // Schedule notification 24 hours before the event
      const notificationTime = new Date(eventTime);
      notificationTime.setHours(notificationTime.getHours() - 24);
      
      // If the notification time is still in the future, queue it
      if (notificationTime > now) {
        await notificationQueue.queueEventNotification(event.id, notificationTime);
      }
    }
    
    return event;
  },
  
  async getEvents(options) {
    return eventModel.getEvents(options);
  },
  
  async getEventById(id) {
    return eventModel.getEventById(id);
  },
  
  async updateEvent(id, eventData, userId) {
    // Check if user is the creator of the event
    const event = await eventModel.getEventById(id);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    if (event.created_by !== userId) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Update the event
    const updatedEvent = await eventModel.updateEvent(id, eventData);
    
    // Update event categories if provided
    if (eventData.categories) {
      await eventModel.setEventCategories(id, eventData.categories);
    }
    
    return updatedEvent;
  },
  
  async deleteEvent(id, userId) {
    // Check if user is the creator of the event
    const event = await eventModel.getEventById(id);
    
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    
    if (event.created_by !== userId) {
      throw new Error('UNAUTHORIZED');
    }
    
    return eventModel.deleteEvent(id);
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
  }
};

module.exports = EventService; 
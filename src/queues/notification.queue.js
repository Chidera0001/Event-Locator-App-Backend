const redis = require('./redis');
const logger = require('../config/logger');
const userService = require('../services/user.service');
const eventService = require('../services/event.service');
const i18next = require('../i18n');

// Queue names
const UPCOMING_EVENTS_QUEUE = 'queue:upcoming-events';
const NOTIFICATION_PROCESSING_QUEUE = 'queue:process-notifications';

// Add event to notification queue
async function queueEventNotification(eventId, scheduledTime) {
  try {
    const payload = JSON.stringify({
      eventId,
      scheduledTime: scheduledTime.toISOString()
    });
    
    await redis.zAdd(UPCOMING_EVENTS_QUEUE, {
      score: scheduledTime.getTime(),
      value: payload
    });
    
    logger.info(`Added event ${eventId} to notification queue for ${scheduledTime}`);
  } catch (error) {
    logger.error('Error queueing event notification:', error);
    throw error;
  }
}

// Process notifications that need to be sent
async function processUpcomingEventNotifications() {
  try {
    const now = Date.now();
    
    // Get all events scheduled for notification up to now
    const results = await redis.zRangeByScore(UPCOMING_EVENTS_QUEUE, 0, now);
    
    if (results.length === 0) {
      return;
    }
    
    logger.info(`Processing ${results.length} event notifications`);
    
    for (const result of results) {
      try {
        const { eventId } = JSON.parse(result);
        
        // Queue the notification processing
        await redis.lPush(NOTIFICATION_PROCESSING_QUEUE, eventId.toString());
        
        // Remove from the scheduled queue
        await redis.zRem(UPCOMING_EVENTS_QUEUE, result);
      } catch (innerError) {
        logger.error('Error processing notification item:', innerError);
      }
    }
  } catch (error) {
    logger.error('Error processing upcoming event notifications:', error);
  }
}

// Send notifications to users who have matching preferences
async function sendEventNotifications(eventId) {
  try {
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      logger.warn(`Event ${eventId} not found for notification`);
      return;
    }
    
    // Get all users interested in this event's categories
    const eventCategories = await eventService.getEventCategories(eventId);
    const categoryIds = eventCategories.map(cat => cat.id);
    
    if (categoryIds.length === 0) {
      logger.info(`Event ${eventId} has no categories, skipping notifications`);
      return;
    }
    
    const interestedUsers = await userService.getUsersByCategories(categoryIds);
    
    logger.info(`Sending notifications for event ${eventId} to ${interestedUsers.length} users`);
    
    // Send notification to each user in their preferred language
    for (const user of interestedUsers) {
      try {
        // Translate notification based on user's language preference
        const eventTitle = event.title;
        const eventTime = new Date(event.start_time).toLocaleString(user.language);
        
        const message = i18next.t('eventNotification', {
          lng: user.language,
          eventTitle,
          eventTime,
          ns: 'event'
        });
        
        // In a real application, you would send this via email, push notification, etc.
        logger.info(`Notification to user ${user.id}: ${message}`);
        
        // For demonstration, just log the notification
        // You would implement actual notification sending here (email, push, etc.)
      } catch (userError) {
        logger.error(`Error sending notification to user ${user.id}:`, userError);
      }
    }
    
    logger.info(`Completed notifications for event ${eventId}`);
  } catch (error) {
    logger.error(`Error sending notifications for event ${eventId}:`, error);
  }
}

// Start workers to process the queues
function startNotificationWorkers() {
  // Check for upcoming events every minute
  setInterval(processUpcomingEventNotifications, 60 * 1000);
  
  // Process the notification queue
  processNotificationQueue();
  
  logger.info('Notification queue workers started');
}

// Process notifications from the queue
async function processNotificationQueue() {
  try {
    while (true) {
      // Block until a message is available, timeout after 5 seconds
      const result = await redis.bLPop(NOTIFICATION_PROCESSING_QUEUE, 5);
      
      if (!result) {
        continue;
      }
      
      const [, eventId] = result;
      
      logger.info(`Processing notification for event ${eventId}`);
      await sendEventNotifications(eventId);
    }
  } catch (error) {
    logger.error('Error in notification queue processing:', error);
    
    // In case of error, wait and restart the processor
    setTimeout(processNotificationQueue, 5000);
  }
}

module.exports = {
  queueEventNotification,
  startNotificationWorkers
}; 
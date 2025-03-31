const { client: redis } = require('../queues/redis');
const eventService = require('./event.service');
const userService = require('./user.service');
const logger = require('../config/logger');
const nodemailer = require('nodemailer');
const emailService = require('./email.service');

// Email configuration (add to .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const NotificationService = {
  async scheduleEventNotifications(eventId) {
    try {
      const event = await eventService.getEventById(eventId);
      if (!event) return;

      // Get users interested in event categories
      const interestedUsers = await userService.getUsersByEventPreferences(event.categories);
      
      // Schedule notifications for 24h and 1h before event
      const eventTime = new Date(event.startTime);
      const notify24h = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000);
      const notify1h = new Date(eventTime.getTime() - 60 * 60 * 1000);

      for (const user of interestedUsers) {
        // Schedule 24h notification
        if (notify24h > new Date()) {
          await redis.zAdd('scheduled_notifications', {
            score: notify24h.getTime(),
            value: JSON.stringify({
              type: 'event_reminder',
              userId: user.id,
              eventId: event.id,
              timing: '24h'
            })
          });
        }

        // Schedule 1h notification
        if (notify1h > new Date()) {
          await redis.zAdd('scheduled_notifications', {
            score: notify1h.getTime(),
            value: JSON.stringify({
              type: 'event_reminder',
              userId: user.id,
              eventId: event.id,
              timing: '1h'
            })
          });
        }
      }
    } catch (error) {
      logger.error('Error scheduling notifications:', error);
    }
  },

  async processNotifications() {
    try {
      const notifications = await redis.zrangebyscore('notifications', '-inf', Date.now());
      
      if (notifications && notifications.length > 0) {
        for (const notification of notifications) {
          try {
            const notificationData = JSON.parse(notification);
            await this.sendNotification(notificationData);
            await redis.zrem('notifications', notification);
          } catch (error) {
            logger.error('Error processing notification:', error);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing notifications:', error);
    }
  },

  async sendNotification(data) {
    try {
      const { userId, eventId, timing } = data;
      const user = await userService.getUserById(userId);
      const event = await eventService.getEventById(eventId);

      if (!user || !event) return;

      // Send email notification
      await emailService.sendEventNotification(user, event, timing);

      logger.info(`Notification sent to user ${userId} for event ${eventId}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }
};

module.exports = NotificationService; 
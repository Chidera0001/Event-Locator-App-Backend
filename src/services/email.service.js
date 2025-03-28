const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEventNotification(user, event, timing) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Event Locator" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Upcoming Event: ${event.title}`,
        html: `
          <h2>Event Reminder</h2>
          <p>Hello ${user.username},</p>
          <p>Your event "${event.title}" is starting in ${timing}!</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Date: ${new Date(event.startTime).toLocaleString()}</li>
            <li>Location: ${event.address}</li>
            <li>Description: ${event.description}</li>
          </ul>
          <p>Don't forget to check the event page for any updates!</p>
        `
      });

      logger.info(`Notification email sent to ${user.email}`, { messageId: info.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send notification email to ${user.email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    try {
      await this.transporter.sendMail({
        from: `"Event Locator" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Welcome to Event Locator!",
        html: `
          <h2>Welcome to Event Locator!</h2>
          <p>Hello ${user.username},</p>
          <p>Thank you for joining Event Locator. We're excited to help you discover amazing events!</p>
          <p>Here are some things you can do:</p>
          <ul>
            <li>Set your location preferences</li>
            <li>Choose your favorite event categories</li>
            <li>Browse nearby events</li>
            <li>Create your own events</li>
          </ul>
          <p>Enjoy using Event Locator!</p>
        `
      });

      logger.info(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send welcome email to ${user.email}:`, error);
      return false;
    }
  }
}

module.exports = new EmailService(); 
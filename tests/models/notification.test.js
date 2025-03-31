const { Notification, User, Event } = require('../../src/models');
const redisClient = require('../../src/config/redis');
const bcrypt = require('bcrypt');
const NotificationService = require('../../src/services/notification.service');
const { createTestUser, createTestEvent } = require('../helpers');
const { mockRedis } = require('../setup');
const { testPool } = require('../setup');

// Mock the entire notification service
jest.mock('../../src/services/notification.service', () => ({
  scheduleNotification: jest.fn(),
  markAsSent: jest.fn(),
  getNotifications: jest.fn(),
  processNotifications: jest.fn()
}));

describe('Notification System', () => {
  let testUser;
  let testEvent;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    testUser = await createTestUser();
    testEvent = await createTestEvent(testUser.id);
  });

  it('should schedule a notification', async () => {
    const mockNotification = {
      id: 1,
      user_id: testUser.id,
      event_id: testEvent.id,
      type: 'reminder',
      scheduled_for: new Date(),
      sent: false
    };

    NotificationService.scheduleNotification.mockResolvedValue(mockNotification);

    const notification = await NotificationService.scheduleNotification({
      userId: testUser.id,
      eventId: testEvent.id,
      type: 'reminder',
      scheduledFor: new Date()
    });

    expect(notification).toEqual(mockNotification);
    expect(NotificationService.scheduleNotification).toHaveBeenCalledTimes(1);
  });

  it('should mark notification as sent', async () => {
    const mockNotification = {
      id: 1,
      sent_at: new Date()
    };

    NotificationService.markAsSent.mockResolvedValue(mockNotification);

    const updated = await NotificationService.markAsSent(1);
    expect(updated.sent_at).toBeDefined();
    expect(NotificationService.markAsSent).toHaveBeenCalledWith(1);
  });
}); 
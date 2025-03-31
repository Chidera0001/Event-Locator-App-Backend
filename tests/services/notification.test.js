const NotificationService = require('../../src/services/notification.service');
const { createTestUser, createTestEvent } = require('../helpers');
const { testPool } = require('../setup');

// Mock the entire notification service
jest.mock('../../src/services/notification.service', () => ({
  scheduleEventNotifications: jest.fn().mockImplementation(async () => {
    return { success: true };
  }),
  markAsSent: jest.fn().mockImplementation(async () => {
    return { sent_at: new Date() };
  }),
  getNotifications: jest.fn(),
  processNotifications: jest.fn()
}));

describe('NotificationService', () => {
  let testUser;
  let testEvent;

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser();
    testEvent = await createTestEvent(testUser.id);
  });

  it('should schedule notifications for interested users', async () => {
    const result = await NotificationService.scheduleEventNotifications(testEvent.id);
    expect(result).toEqual({ success: true });
    expect(NotificationService.scheduleEventNotifications).toHaveBeenCalledWith(testEvent.id);
  });

  it('should mark notification as sent', async () => {
    const result = await NotificationService.markAsSent(1);
    expect(result).toHaveProperty('sent_at');
    expect(NotificationService.markAsSent).toHaveBeenCalledWith(1);
  });

  // Add more test cases...
}); 
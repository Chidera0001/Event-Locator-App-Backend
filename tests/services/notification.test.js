const NotificationService = require('../../src/services/notification.service');
const redis = require('../../src/queues/redis');
const eventService = require('../../src/services/event.service');
const userService = require('../../src/services/user.service');

jest.mock('../../src/queues/redis');
jest.mock('../../src/services/event.service');
jest.mock('../../src/services/user.service');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleEventNotifications', () => {
    it('should schedule notifications for interested users', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        categories: [1, 2]
      };

      const mockUsers = [
        { id: 1, email: 'user1@test.com' },
        { id: 2, email: 'user2@test.com' }
      ];

      eventService.getEventById.mockResolvedValue(mockEvent);
      userService.getUsersByEventPreferences.mockResolvedValue(mockUsers);
      redis.zAdd.mockResolvedValue(1);

      await NotificationService.scheduleEventNotifications(1);

      expect(redis.zAdd).toHaveBeenCalledTimes(4); // 2 users * 2 notifications each
    });
  });

  // Add more test cases...
}); 
const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/markNotificationRead', () => {
  test('marks current user notification as read', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1', role: 'user' }] })
    };
    const docApi = {
      get: jest.fn().mockResolvedValue({
        data: { _id: 'notice-1', userOpenid: 'test-openid' }
      }),
      update: jest.fn().mockResolvedValue({})
    };
    const notificationsCollection = {
      doc: jest.fn(() => docApi)
    };

    const { main } = loadCloudFunction('../../cloudfunctions/markNotificationRead/index', {
      collections: {
        users: usersCollection,
        notifications: notificationsCollection
      }
    });

    const result = await main({ notificationId: 'notice-1' });

    expect(docApi.update).toHaveBeenCalledWith({
      data: { isRead: true }
    });
    expect(result).toEqual({ code: 0, data: { notificationId: 'notice-1' } });
  });
});


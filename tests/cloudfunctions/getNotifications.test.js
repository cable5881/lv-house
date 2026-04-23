const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getNotifications', () => {
  test('returns notification list and unread count', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1', role: 'user' }] })
    };

    const notificationsCollection = {
      where: jest.fn()
    };
    const listQuery = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [{ _id: 'notice-1', title: '收到新的评论回复', isRead: false }]
      })
    };
    const unreadQuery = {
      count: jest.fn().mockResolvedValue({ total: 1 })
    };

    notificationsCollection.where
      .mockImplementationOnce(() => listQuery)
      .mockImplementationOnce(() => unreadQuery);

    const { main } = loadCloudFunction('../../cloudfunctions/getNotifications/index', {
      collections: {
        users: usersCollection,
        notifications: notificationsCollection
      }
    });

    const result = await main({ page: 1, pageSize: 20 });

    expect(result).toEqual({
      code: 0,
      data: {
        list: [{ _id: 'notice-1', title: '收到新的评论回复', isRead: false }],
        unreadCount: 1,
        page: 1,
        pageSize: 20,
        hasMore: false
      }
    });
  });
});


const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/deleteComment', () => {
  test('allows author to soft-delete own comment', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [{ _id: 'user-1', role: 'user' }]
      })
    };
    const commentDocApi = {
      get: jest.fn().mockResolvedValue({
        data: { _id: 'comment-1', userOpenid: 'test-openid' }
      }),
      update: jest.fn().mockResolvedValue({})
    };
    const commentsCollection = {
      doc: jest.fn(() => commentDocApi)
    };

    const { main } = loadCloudFunction('../../cloudfunctions/deleteComment/index', {
      collections: {
        users: usersCollection,
        comments: commentsCollection
      }
    });

    const result = await main({ commentId: 'comment-1' });

    expect(commentDocApi.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'deleted',
        content: '',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(result).toEqual({ code: 0, data: { commentId: 'comment-1' } });
  });
});


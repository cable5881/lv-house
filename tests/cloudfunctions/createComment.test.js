const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/createComment', () => {
  test('creates a top-level comment for logged-in user', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [{ _id: 'user-1', nickName: '小吕', avatarUrl: '/avatar.png', role: 'user' }]
      })
    };
    const goodsCollection = {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: { _id: 'goods-1', status: 'published' }
        })
      }))
    };
    const commentsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'comment-1' })
    };
    const notificationsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'notify-1' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/createComment/index', {
      collections: {
        users: usersCollection,
        goods: goodsCollection,
        comments: commentsCollection,
        notifications: notificationsCollection
      }
    });

    const result = await main({
      goodsId: 'goods-1',
      content: '很实用'
    });

    expect(commentsCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        goodsId: 'goods-1',
        content: '很实用',
        parentId: '',
        rootId: '',
        userOpenid: 'test-openid',
        status: 'normal'
      })
    });
    expect(notificationsCollection.add).not.toHaveBeenCalled();
    expect(result).toEqual({
      code: 0,
      data: expect.objectContaining({
        _id: 'comment-1',
        content: '很实用'
      })
    });
  });

  test('creates reply notification for replied user', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [{ _id: 'user-1', nickName: '小吕', avatarUrl: '/avatar.png', role: 'user' }]
      })
    };
    const goodsCollection = {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: { _id: 'goods-1', status: 'published' }
        })
      }))
    };
    const commentsDocApi = {
      get: jest.fn().mockResolvedValue({
        data: {
          _id: 'root-1',
          rootId: '',
          userOpenid: 'another-user',
          userSnapshot: { nickName: '原评论用户' }
        }
      })
    };
    const commentsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'reply-1' }),
      doc: jest.fn(() => commentsDocApi)
    };
    const notificationsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'notify-1' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/createComment/index', {
      collections: {
        users: usersCollection,
        goods: goodsCollection,
        comments: commentsCollection,
        notifications: notificationsCollection
      }
    });

    await main({
      goodsId: 'goods-1',
      content: '回复一下',
      parentId: 'root-1'
    });

    expect(notificationsCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userOpenid: 'another-user',
        type: 'reply_to_my_comment',
        relatedGoodsId: 'goods-1',
        relatedCommentId: 'reply-1',
        content: '回复一下',
        isRead: false
      })
    });
  });
});


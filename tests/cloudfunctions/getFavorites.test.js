const { loadCloudFunction, createCommandMock } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getFavorites', () => {
  test('returns current user favorites joined with published goods', async () => {
    const command = createCommandMock();
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1' }] })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [
          { _id: 'fav-1', goodsId: 'goods-2', createdAt: '2026-04-20' },
          { _id: 'fav-2', goodsId: 'goods-1', createdAt: '2026-04-19' }
        ]
      })
    };
    const goodsCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [
          { _id: 'goods-1', name: '台灯', status: 'published' },
          { _id: 'goods-2', name: '收纳架', status: 'published' }
        ]
      })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/getFavorites/index', {
      openid: 'openid-1',
      command,
      collections: {
        users: usersCollection,
        favorites: favoritesCollection,
        goods: goodsCollection
      }
    });

    const result = await main({ page: 1, pageSize: 10 });

    expect(command.in).toHaveBeenCalledWith(['goods-2', 'goods-1']);
    expect(goodsCollection.where).toHaveBeenCalledWith({
      _id: { $in: ['goods-2', 'goods-1'] },
      status: 'published'
    });
    expect(result).toEqual({
      code: 0,
      data: {
        list: [
          { _id: 'goods-2', name: '收纳架', status: 'published', favoriteId: 'fav-1', favoritedAt: '2026-04-20', isFavorited: true },
          { _id: 'goods-1', name: '台灯', status: 'published', favoriteId: 'fav-2', favoritedAt: '2026-04-19', isFavorited: true }
        ],
        page: 1,
        pageSize: 10
      }
    });
  });

  test('returns empty list when favorites collection is not created yet', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1' }] })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockRejectedValue(new Error('collection.get:fail -502005 database collection not exists. [ResourceNotFound] Db or Table not exist: favorites'))
    };

    const { main } = loadCloudFunction('../../cloudfunctions/getFavorites/index', {
      openid: 'openid-1',
      collections: {
        users: usersCollection,
        favorites: favoritesCollection,
        goods: { where: jest.fn(), get: jest.fn() }
      }
    });

    const result = await main({ page: 1, pageSize: 10 });

    expect(result).toEqual({
      code: 0,
      data: {
        list: [],
        page: 1,
        pageSize: 10
      }
    });
  });
});

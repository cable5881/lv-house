const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/toggleFavorite', () => {
  test('creates favorite record and increments like count', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1' }] })
    };
    const goodsDocUpdate = jest.fn().mockResolvedValue({});
    const goodsCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { _id: 'goods-1', status: 'published', likeCount: 3 } }),
        update: goodsDocUpdate
      })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [] }),
      add: jest.fn().mockResolvedValue({ _id: 'fav-1' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/toggleFavorite/index', {
      openid: 'openid-1',
      collections: {
        users: usersCollection,
        goods: goodsCollection,
        favorites: favoritesCollection
      }
    });

    const result = await main({ goodsId: 'goods-1' });

    expect(favoritesCollection.add).toHaveBeenCalledWith({
      data: {
        userOpenid: 'openid-1',
        goodsId: 'goods-1',
        createdAt: 'SERVER_DATE',
        updatedAt: 'SERVER_DATE'
      }
    });
    expect(goodsDocUpdate).toHaveBeenCalledWith({
      data: {
        likeCount: 4,
        updatedAt: 'SERVER_DATE'
      }
    });
    expect(result).toEqual({
      code: 0,
      data: {
        favorited: true,
        likeCount: 4
      }
    });
  });

  test('removes existing favorite record and decrements like count', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1' }] })
    };
    const goodsDocUpdate = jest.fn().mockResolvedValue({});
    const favoritesRemove = jest.fn().mockResolvedValue({});
    const goodsCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { _id: 'goods-1', status: 'published', likeCount: 2 } }),
        update: goodsDocUpdate
      })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'fav-1' }] }),
      doc: jest.fn().mockReturnValue({
        remove: favoritesRemove
      })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/toggleFavorite/index', {
      openid: 'openid-1',
      collections: {
        users: usersCollection,
        goods: goodsCollection,
        favorites: favoritesCollection
      }
    });

    const result = await main({ goodsId: 'goods-1' });

    expect(favoritesCollection.doc).toHaveBeenCalledWith('fav-1');
    expect(favoritesRemove).toHaveBeenCalled();
    expect(goodsDocUpdate).toHaveBeenCalledWith({
      data: {
        likeCount: 1,
        updatedAt: 'SERVER_DATE'
      }
    });
    expect(result).toEqual({
      code: 0,
      data: {
        favorited: false,
        likeCount: 1
      }
    });
  });

  test('returns readable message when favorites collection is missing', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'user-1' }] })
    };
    const goodsCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { _id: 'goods-1', status: 'published', likeCount: 3 } }),
        update: jest.fn().mockResolvedValue({})
      })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockRejectedValue(new Error('collection.get:fail -502005 database collection not exists. [ResourceNotFound] Db or Table not exist: favorites'))
    };

    const { main } = loadCloudFunction('../../cloudfunctions/toggleFavorite/index', {
      openid: 'openid-1',
      collections: {
        users: usersCollection,
        goods: goodsCollection,
        favorites: favoritesCollection
      }
    });

    const result = await main({ goodsId: 'goods-1' });

    expect(result).toEqual({
      code: 412,
      message: '收藏功能未初始化，请先在云开发数据库创建 favorites 集合后重试'
    });
  });
});

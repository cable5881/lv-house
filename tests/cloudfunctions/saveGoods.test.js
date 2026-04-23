const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/saveGoods', () => {
  test('rejects non-admin users', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [] })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/saveGoods/index', {
      collections: {
        users: usersCollection
      }
    });

    const result = await main({ name: '收纳盒' });

    expect(result).toEqual({ code: 403, message: '无权限' });
  });

  test('creates a new goods document with normalized defaults', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1' }] })
    };
    const goodsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'goods-1' }),
      doc: jest.fn()
    };

    const { main, db } = loadCloudFunction('../../cloudfunctions/saveGoods/index', {
      collections: {
        users: usersCollection,
        goods: goodsCollection
      }
    });

    const result = await main({
      name: '桌面收纳盒',
      price: '18.8',
      rating: 99,
      status: 'published'
    });

    expect(goodsCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '桌面收纳盒',
        price: 18.8,
        rating: 10,
        status: 'published',
        viewCount: 0,
        likeCount: 0,
        sortOrder: 0,
        createdAt: 'SERVER_DATE',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(db.serverDate).toHaveBeenCalled();
    expect(result).toEqual({ code: 0, data: { _id: 'goods-1' } });
  });
});

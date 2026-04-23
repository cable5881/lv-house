const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getGoods', () => {
  test('builds query, sorting and pagination correctly', async () => {
    const goodsCollection = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'goods-1' }] })
    };

    const { main, db, command } = loadCloudFunction('../../cloudfunctions/getGoods/index', {
      collections: {
        goods: goodsCollection
      }
    });

    const result = await main({
      roomId: 'room-1',
      priceMin: 10,
      priceMax: 99,
      minRating: 8,
      keyword: '收纳',
      sortBy: 'price_asc',
      page: 2,
      pageSize: 5
    });

    expect(command.eq).toHaveBeenCalledWith('room-1');
    expect(command.elemMatch).toHaveBeenCalled();
    expect(command.gte).toHaveBeenCalledWith(10);
    expect(command.lte).toHaveBeenCalledWith(99);
    expect(db.RegExp).toHaveBeenCalledWith({ regexp: '收纳', options: 'i' });
    expect(goodsCollection.where).toHaveBeenCalledWith({
      status: 'published',
      roomIds: { $elemMatch: { $eq: 'room-1' } },
      price: { $gte: 10, $lte: 99 },
      rating: { $gte: 8 },
      name: { $regex: { regexp: '收纳', options: 'i' } }
    });
    expect(goodsCollection.orderBy).toHaveBeenCalledWith('price', 'asc');
    expect(goodsCollection.skip).toHaveBeenCalledWith(5);
    expect(goodsCollection.limit).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      code: 0,
      data: {
        list: [{ _id: 'goods-1' }],
        page: 2,
        pageSize: 5
      }
    });
  });
});

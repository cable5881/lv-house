const { loadCloudFunction, createCommandMock } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getGoodsDetail', () => {
  test('returns detail with dimension names and favorite state', async () => {
    const command = createCommandMock();
    const goodsDocUpdate = jest.fn().mockResolvedValue({});
    const goodsDocGet = jest.fn().mockResolvedValue({
      data: {
        _id: 'goods-1',
        collectionIds: ['collection-1'],
        sceneIds: ['scene-1'],
        roomIds: ['room-1'],
        tagIds: ['tag-1']
      }
    });
    const goodsCollection = {
      doc: jest.fn().mockReturnValue({
        update: goodsDocUpdate,
        get: goodsDocGet
      })
    };
    const collectionsCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'collection-1', title: '精选', periodLabel: '第1期' }] })
    };
    const scenesCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'scene-1', name: '卧室收纳' }] })
    };
    const roomsCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'room-1', name: '卧室' }] })
    };
    const tagsCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'tag-1', name: '平价' }] })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'fav-1' }] })
    };

    const { main, command: usedCommand } = loadCloudFunction('../../cloudfunctions/getGoodsDetail/index', {
      openid: 'openid-1',
      command,
      collections: {
        goods: goodsCollection,
        collections: collectionsCollection,
        scenes: scenesCollection,
        rooms: roomsCollection,
        tags: tagsCollection,
        favorites: favoritesCollection
      }
    });

    const result = await main({ id: 'goods-1' });

    expect(usedCommand.inc).toHaveBeenCalledWith(1);
    expect(goodsDocUpdate).toHaveBeenCalledWith({ data: { viewCount: { $inc: 1 } } });
    expect(usedCommand.in).toHaveBeenCalledWith(['collection-1']);
    expect(result).toEqual({
      code: 0,
      data: {
        _id: 'goods-1',
        collectionIds: ['collection-1'],
        sceneIds: ['scene-1'],
        roomIds: ['room-1'],
        tagIds: ['tag-1'],
        collectionNames: ['第1期'],
        sceneNames: ['卧室收纳'],
        roomNames: ['卧室'],
        tagNames: ['平价'],
        isFavorited: true
      }
    });
  });

  test('falls back to not favorited when favorites collection is missing', async () => {
    const goodsCollection = {
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({
          data: {
            _id: 'goods-1',
            collectionIds: [],
            sceneIds: [],
            roomIds: [],
            tagIds: []
          }
        })
      })
    };
    const favoritesCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockRejectedValue(new Error('collection.get:fail -502005 database collection not exists. [ResourceNotFound] Db or Table not exist: favorites'))
    };

    const { main } = loadCloudFunction('../../cloudfunctions/getGoodsDetail/index', {
      openid: 'openid-1',
      collections: {
        goods: goodsCollection,
        favorites: favoritesCollection
      }
    });

    const result = await main({ id: 'goods-1' });

    expect(result).toEqual({
      code: 0,
      data: {
        _id: 'goods-1',
        collectionIds: [],
        sceneIds: [],
        roomIds: [],
        tagIds: [],
        collectionNames: [],
        sceneNames: [],
        roomNames: [],
        tagNames: [],
        isFavorited: false
      }
    });
  });
});

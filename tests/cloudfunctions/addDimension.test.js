const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/addDimension', () => {
  test('fills collection defaults when admin creates a collection', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1', role: 'admin' }] })
    };
    const collectionsCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'collection-1' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/addDimension/index', {
      collections: {
        users: usersCollection,
        collections: collectionsCollection
      }
    });

    const result = await main({
      collectionName: 'collections',
      doc: {
        title: '20260406'
      }
    });

    expect(collectionsCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: '20260406',
        periodLabel: '20260406',
        status: 'published',
        sortOrder: 0,
        coverImage: '',
        publishDate: 'SERVER_DATE',
        createdAt: 'SERVER_DATE',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(result).toEqual({
      code: 0,
      data: expect.objectContaining({
        _id: 'collection-1',
        title: '20260406',
        periodLabel: '20260406',
        status: 'published'
      })
    });
  });

  test('fills scene defaults when admin creates a scene', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1', role: 'admin' }] })
    };
    const scenesCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'scene-1' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/addDimension/index', {
      collections: {
        users: usersCollection,
        scenes: scenesCollection
      }
    });

    await main({
      collectionName: 'scenes',
      doc: {
        name: '搬家必备'
      }
    });

    expect(scenesCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '搬家必备',
        status: 'active',
        sortOrder: 0,
        icon: '',
        coverImage: '',
        createdAt: 'SERVER_DATE',
        updatedAt: 'SERVER_DATE'
      })
    });
  });
});

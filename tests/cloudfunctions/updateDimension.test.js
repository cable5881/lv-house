const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/updateDimension', () => {
  test('rejects non-admin users', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [] })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/updateDimension/index', {
      collections: {
        users: usersCollection
      }
    });

    const result = await main({
      collectionName: 'collections',
      id: 'col-1',
      updates: { title: '新标题' }
    });

    expect(result).toEqual({ code: 403, message: '无权限' });
  });

  test('updates only allowed fields and returns the latest document', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1', role: 'admin' }] })
    };

    const docApi = {
      update: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({
        data: {
          _id: 'col-1',
          title: '春日焕新',
          coverImage: 'cloud://cover.png'
        }
      })
    };
    const collectionsCollection = {
      doc: jest.fn(() => docApi)
    };

    const { main } = loadCloudFunction('../../cloudfunctions/updateDimension/index', {
      collections: {
        users: usersCollection,
        collections: collectionsCollection
      }
    });

    const result = await main({
      collectionName: 'collections',
      id: 'col-1',
      updates: {
        title: '春日焕新',
        coverImage: 'cloud://cover.png',
        unknownField: 'ignored'
      }
    });

    expect(docApi.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: '春日焕新',
        coverImage: 'cloud://cover.png',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(result).toEqual({
      code: 0,
      data: {
        _id: 'col-1',
        title: '春日焕新',
        coverImage: 'cloud://cover.png'
      }
    });
  });

  test('allows coverImage for scenes', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1', role: 'admin' }] })
    };
    const docApi = {
      update: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({
        data: {
          _id: 'scene-1',
          name: '搬家必备',
          coverImage: 'cloud://scene-cover.png'
        }
      })
    };
    const scenesCollection = {
      doc: jest.fn(() => docApi)
    };

    const { main } = loadCloudFunction('../../cloudfunctions/updateDimension/index', {
      collections: {
        users: usersCollection,
        scenes: scenesCollection
      }
    });

    await main({
      collectionName: 'scenes',
      id: 'scene-1',
      updates: {
        name: '搬家必备',
        coverImage: 'cloud://scene-cover.png'
      }
    });

    expect(docApi.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '搬家必备',
        coverImage: 'cloud://scene-cover.png',
        updatedAt: 'SERVER_DATE'
      })
    });
  });
});

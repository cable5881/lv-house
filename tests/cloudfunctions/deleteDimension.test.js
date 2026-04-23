const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/deleteDimension', () => {
  test('rejects non-admin users', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [] })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/deleteDimension/index', {
      collections: {
        users: usersCollection
      }
    });

    const result = await main({
      collectionName: 'scenes',
      id: 'scene-1'
    });

    expect(result).toEqual({ code: 403, message: '无权限' });
  });

  test('deletes the specified dimension for admin', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [{ _id: 'admin-1', role: 'admin' }] })
    };
    const docApi = {
      remove: jest.fn().mockResolvedValue({})
    };
    const scenesCollection = {
      doc: jest.fn(() => docApi)
    };

    const { main } = loadCloudFunction('../../cloudfunctions/deleteDimension/index', {
      collections: {
        users: usersCollection,
        scenes: scenesCollection
      }
    });

    const result = await main({
      collectionName: 'scenes',
      id: 'scene-1'
    });

    expect(scenesCollection.doc).toHaveBeenCalledWith('scene-1');
    expect(docApi.remove).toHaveBeenCalled();
    expect(result).toEqual({ code: 0, data: {} });
  });
});


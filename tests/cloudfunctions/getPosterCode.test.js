const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getPosterCode', () => {
  test('returns cached poster code when goods already has posterCodeFileId', async () => {
    const goodsCollection = {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            _id: 'goods-1',
            status: 'published',
            posterCodeFileId: 'cloud://cached-poster.png'
          }
        })
      }))
    };

    const { main } = loadCloudFunction('../../cloudfunctions/getPosterCode/index', {
      collections: { goods: goodsCollection },
      cloudOverrides: {
        openapi: {
          wxacode: {
            getUnlimited: jest.fn()
          }
        },
        uploadFile: jest.fn()
      }
    });

    const result = await main({ goodsId: 'goods-1' });

    expect(result).toEqual({
      code: 0,
      data: { fileID: 'cloud://cached-poster.png' }
    });
  });

  test('generates poster code and stores fileID', async () => {
    const goodsDocApi = {
      get: jest.fn().mockResolvedValue({
        data: {
          _id: 'goods-1',
          status: 'published'
        }
      }),
      update: jest.fn().mockResolvedValue({})
    };
    const goodsCollection = {
      doc: jest.fn(() => goodsDocApi)
    };
    const getUnlimited = jest.fn().mockResolvedValue({ buffer: Buffer.from('png') });
    const uploadFile = jest.fn().mockResolvedValue({ fileID: 'cloud://poster-code.png' });

    const { main } = loadCloudFunction('../../cloudfunctions/getPosterCode/index', {
      collections: { goods: goodsCollection },
      cloudOverrides: {
        openapi: {
          wxacode: {
            getUnlimited
          }
        },
        uploadFile
      }
    });

    const result = await main({ goodsId: 'goods-1' });

    expect(getUnlimited).toHaveBeenCalledWith(expect.objectContaining({
      scene: 'goods-1',
      page: 'pages/goods/detail/detail'
    }));
    expect(uploadFile).toHaveBeenCalledWith({
      cloudPath: 'posters/codes/goods-1.png',
      fileContent: expect.any(Buffer)
    });
    expect(goodsDocApi.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        posterCodeFileId: 'cloud://poster-code.png',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(result).toEqual({
      code: 0,
      data: { fileID: 'cloud://poster-code.png' }
    });
  });
});


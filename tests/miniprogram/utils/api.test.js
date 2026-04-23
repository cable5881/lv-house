describe('miniprogram/utils/api', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.wx = {
      cloud: {
        callFunction: jest.fn()
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.wx;
  });

  test('returns business data when cloud call succeeds', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      result: {
        code: 0,
        data: { list: [{ _id: 'g1' }] }
      }
    });

    const api = require('../../../miniprogram/utils/api');
    const result = await api.getGoods({ page: 1 });

    expect(global.wx.cloud.callFunction).toHaveBeenCalledWith({
      name: 'getGoods',
      data: { page: 1 }
    });
    expect(result).toEqual({ list: [{ _id: 'g1' }] });
  });

  test('throws a readable error when cloud business code is not zero', async () => {
    global.wx.cloud.callFunction.mockResolvedValue({
      result: {
        code: 500,
        message: '服务异常'
      }
    });

    const api = require('../../../miniprogram/utils/api');

    await expect(api.toggleFavorite('goods-1')).rejects.toThrow('服务异常');
    expect(global.wx.cloud.callFunction).toHaveBeenCalledWith({
      name: 'toggleFavorite',
      data: { goodsId: 'goods-1' }
    });
  });

  test('throws deployment hint when cloud function is missing', async () => {
    global.wx.cloud.callFunction.mockRejectedValue({
      errMsg: 'fail errCode: -501000 FunctionName parameter could not be found'
    });

    const api = require('../../../miniprogram/utils/api');

    await expect(api.toggleFavorite('goods-1')).rejects.toThrow(
      '云函数 toggleFavorite 未部署，请在微信开发者工具中上传并部署后重试'
    );
  });
});

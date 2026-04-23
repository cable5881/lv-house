describe('miniprogram/utils/auth', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = {
      globalData: {
        userInfo: null,
        isLoggedIn: false,
        isAdmin: false,
        openid: ''
      }
    };

    global.getApp = jest.fn(() => app);
    global.wx = {
      setStorageSync: jest.fn(),
      removeStorageSync: jest.fn()
    };
  });

  afterEach(() => {
    delete global.getApp;
    delete global.wx;
  });

  test('doLogin writes user state into app globalData and storage', async () => {
    jest.doMock('../../../miniprogram/utils/api', () => ({
      login: jest.fn().mockResolvedValue({
        openid: 'openid-1',
        userInfo: { _id: 'u1', role: 'admin', nickName: '测试用户' }
      })
    }));

    const auth = require('../../../miniprogram/utils/auth');
    const userInfo = await auth.doLogin();

    expect(userInfo.openid).toBe('openid-1');
    expect(app.globalData.isLoggedIn).toBe(true);
    expect(app.globalData.isAdmin).toBe(true);
    expect(app.globalData.openid).toBe('openid-1');
    expect(global.wx.setStorageSync).toHaveBeenCalledWith('userInfo', userInfo);
  });

  test('doLogout clears cached login state', () => {
    const auth = require('../../../miniprogram/utils/auth');

    app.globalData.userInfo = { _id: 'u1' };
    app.globalData.isLoggedIn = true;
    app.globalData.isAdmin = true;
    app.globalData.openid = 'openid-1';

    auth.doLogout();

    expect(global.wx.removeStorageSync).toHaveBeenCalledWith('userInfo');
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.isAdmin()).toBe(false);
    expect(app.globalData.userInfo).toBeNull();
  });
});

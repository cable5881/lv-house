/**
 * 登录与权限工具
 */
const api = require('./api');

/**
 * 执行登录流程
 */
const doLogin = async () => {
  try {
    const app = getApp();
    const data = await api.login();
    const userInfo = data.userInfo || data;
    userInfo.openid = data.openid || userInfo._openid || '';

    // 缓存用户信息
    wx.setStorageSync('userInfo', userInfo);
    app.globalData.userInfo = userInfo;
    app.globalData.isLoggedIn = true;
    app.globalData.isAdmin = userInfo.role === 'admin';
    app.globalData.openid = userInfo.openid;

    return userInfo;
  } catch (err) {
    console.error('登录失败', err);
    throw err;
  }
};

/**
 * 退出登录
 */
const doLogout = () => {
  const app = getApp();
  wx.removeStorageSync('userInfo');
  app.globalData.userInfo = null;
  app.globalData.isLoggedIn = false;
  app.globalData.isAdmin = false;
  app.globalData.openid = '';
};

/**
 * 检查是否是管理员
 */
const isAdmin = () => {
  const app = getApp();
  return app.globalData.isAdmin === true;
};

/**
 * 检查是否已登录
 */
const isLoggedIn = () => {
  const app = getApp();
  return app.globalData.isLoggedIn === true;
};

module.exports = { doLogin, doLogout, isAdmin, isLoggedIn };

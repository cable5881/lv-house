const authUtil = require('../../../utils/auth');
Page({
  async doLogin() {
    try {
      await authUtil.doLogin();
      wx.navigateBack();
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  }
});
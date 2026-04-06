const authUtil = require('../../../utils/auth');

Page({
  data: {
    avatarUrl: '',
    nickName: ''
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onNickNameBlur(e) {
    if (e.detail.value) {
      this.setData({ nickName: e.detail.value });
    }
  },

  async doLogin() {
    wx.showLoading({ title: '登录中' });
    try {
      const userInfo = await authUtil.doLogin();

      // 如果用户选择了头像或昵称，更新到云端
      const updates = {};
      if (this.data.avatarUrl) updates.avatarUrl = this.data.avatarUrl;
      if (this.data.nickName) updates.nickName = this.data.nickName;

      if (Object.keys(updates).length > 0) {
        const api = require('../../../utils/api');
        await api.updateUserInfo(updates);
        const app = getApp();
        Object.assign(app.globalData.userInfo, updates);
        wx.setStorageSync('userInfo', app.globalData.userInfo);
      }

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('登录失败详情:', err);
      // 显示具体错误信息帮助排查
      wx.showModal({
        title: '登录失败',
        content: err.message || JSON.stringify(err),
        showCancel: false
      });
    }
  },

  skipLogin() {
    wx.navigateBack();
  }
});

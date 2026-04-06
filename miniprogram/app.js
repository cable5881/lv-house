App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    isAdmin: false,
    openid: ''
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      traceUser: true
    });

    // 尝试从缓存恢复登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.isAdmin = userInfo.role === 'admin';
      this.globalData.openid = userInfo.openid || '';
    }
  }
});

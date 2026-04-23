const authUtil = require('../../../utils/auth');
const api = require('../../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    isAdmin: false,
    userInfo: null,
    favoriteGoods: [],
    favoritePage: 1,
    favoriteHasMore: true,
    favoriteLoading: false,
    notificationUnreadCount: 0,
    genderText: '',
    showEditProfile: false,
    editBirthday: '',
    editGenderIndex: 0,
    genderOptions: [
      { value: 0, label: '未设置' },
      { value: 1, label: '男' },
      { value: 2, label: '女' }
    ]
  },

  onShow() {
    this.refreshState();
    if (getApp().globalData.isLoggedIn) {
      this.loadFavorites();
      this.loadNotificationsSummary();
    } else {
      this.setData({
        favoriteGoods: [],
        favoritePage: 1,
        favoriteHasMore: true,
        favoriteLoading: false,
        notificationUnreadCount: 0
      });
    }
  },

  onReachBottom() {
    if (this.data.isLoggedIn && this.data.favoriteHasMore && !this.data.favoriteLoading) {
      this.loadFavorites(true);
    }
  },

  refreshState() {
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    const userInfo = app.globalData.userInfo;
    const isAdmin = app.globalData.isAdmin;
    let genderText = '';
    if (userInfo) {
      if (userInfo.gender === 1) genderText = '👨 男';
      else if (userInfo.gender === 2) genderText = '👩 女';
    }
    const nextData = { isLoggedIn, userInfo, isAdmin, genderText };
    if (!isLoggedIn) {
      nextData.favoriteGoods = [];
      nextData.favoritePage = 1;
      nextData.favoriteHasMore = true;
      nextData.favoriteLoading = false;
      nextData.notificationUnreadCount = 0;
    }
    this.setData(nextData);
  },

  async loadFavorites(append) {
    if (!this.data.isLoggedIn) return;
    const page = append ? this.data.favoritePage + 1 : 1;
    this.setData({ favoriteLoading: true });
    try {
      const data = await api.getFavorites({ page, pageSize: 10 });
      const list = data.list || data;
      this.setData({
        favoriteGoods: append ? this.data.favoriteGoods.concat(list) : list,
        favoritePage: page,
        favoriteHasMore: list.length >= 10,
        favoriteLoading: false
      });
    } catch (err) {
      this.setData({ favoriteLoading: false });
      if (!append) {
        this.setData({
          favoriteGoods: [],
          favoritePage: 1,
          favoriteHasMore: true
        });
      }
    }
  },

  async loadNotificationsSummary() {
    if (!this.data.isLoggedIn) return;
    try {
      const data = await api.getNotifications({ page: 1, pageSize: 1 });
      this.setData({
        notificationUnreadCount: Number(data.unreadCount) || 0
      });
    } catch (err) {}
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index/index' });
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notice/index/index' });
  },

  doLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authUtil.doLogout();
          this.refreshState();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  editProfile() {
    const ui = this.data.userInfo || {};
    const gIdx = this.data.genderOptions.findIndex(g => g.value === (ui.gender || 0));
    this.setData({
      showEditProfile: true,
      editBirthday: ui.birthday || '',
      editGenderIndex: gIdx >= 0 ? gIdx : 0
    });
  },

  closeEditProfile() { this.setData({ showEditProfile: false }); },

  onBirthdayChange(e) { this.setData({ editBirthday: e.detail.value }); },

  onGenderChange(e) { this.setData({ editGenderIndex: Number(e.detail.value) }); },

  async saveProfile() {
    const birthday = this.data.editBirthday;
    const gender = this.data.genderOptions[this.data.editGenderIndex].value;

    wx.showLoading({ title: '保存中' });
    try {
      await api.updateUserInfo({ birthday, gender });
      const app = getApp();
      app.globalData.userInfo.birthday = birthday;
      app.globalData.userInfo.gender = gender;
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      this.refreshState();
      this.setData({ showEditProfile: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  goDataManage() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});

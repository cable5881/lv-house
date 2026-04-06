const authUtil = require('../../../utils/auth');
const api = require('../../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    isAdmin: false,
    userInfo: null,
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
    this.setData({ isLoggedIn, userInfo, isAdmin, genderText });
  },

  async doLogin() {
    try {
      // 使用微信头像昵称获取能力
      wx.showLoading({ title: '登录中' });
      await authUtil.doLogin();
      this.refreshState();
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
    wx.hideLoading();
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
      // 更新本地缓存
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

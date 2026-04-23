const api = require('../../../utils/api');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    notifications: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onShow() {
    this.loadNotifications();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNotifications(true);
    }
  },

  decorateList(list) {
    return (list || []).map(item => ({
      ...item,
      displayDate: formatDate(item.createdAt)
    }));
  },

  async loadNotifications(append) {
    if (this.data.loading) return;
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true });
    try {
      const data = await api.getNotifications({ page, pageSize: 20 });
      const list = this.decorateList(data.list || []);
      this.setData({
        notifications: append ? this.data.notifications.concat(list) : list,
        page,
        hasMore: !!data.hasMore,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      if (!append) {
        this.setData({ notifications: [], page: 1, hasMore: true });
      }
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    }
  },

  async openNotification(e) {
    const { id, goodsId } = e.currentTarget.dataset;
    try {
      await api.markNotificationRead(id);
      const notifications = this.data.notifications.map(item => (
        item._id === id ? { ...item, isRead: true } : item
      ));
      this.setData({ notifications });
    } catch (err) {}

    if (goodsId) {
      wx.navigateTo({ url: `/pages/goods/detail/detail?id=${goodsId}` });
    }
  }
});


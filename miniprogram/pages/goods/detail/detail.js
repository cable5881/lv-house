const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    goods: null,
    relatedGoods: [],
    shelfTimeText: '',
    isAdmin: false,
    favoriteLoading: false
  },

  onLoad(options) {
    this.goodsId = options.id;
    this.setData({ isAdmin: auth.isAdmin() });
    this.loadDetail();
  },

  async loadDetail() {
    wx.showLoading({ title: '加载中' });
    try {
      const goods = await api.getGoodsDetail(this.goodsId);
      this.setData({
        goods,
        shelfTimeText: formatDate(goods.shelfTime)
      });
      this.loadRelated(goods);
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async loadRelated(goods) {
    try {
      const roomId = goods.roomIds && goods.roomIds[0];
      if (roomId) {
        const data = await api.getGoods({ roomId, pageSize: 6 });
        const list = (data.list || data).filter(g => g._id !== this.goodsId);
        this.setData({ relatedGoods: list.slice(0, 6) });
      }
    } catch (err) {}
  },

  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: this.data.goods.images
    });
  },

  copyLink() {
    const link = this.data.goods.purchaseLink;
    if (link) {
      wx.setClipboardData({ data: link });
    } else {
      wx.showToast({ title: '暂无购买链接', icon: 'none' });
    }
  },

  goBuy() {
    const link = this.data.goods.purchaseLink;
    if (link) {
      wx.setClipboardData({
        data: link,
        success() {
          wx.showToast({ title: '链接已复制，请打开浏览器粘贴购买', icon: 'none', duration: 2500 });
        }
      });
    } else {
      wx.showToast({ title: '暂无购买链接', icon: 'none' });
    }
  },

  async toggleFavorite() {
    if (!auth.isLoggedIn()) {
      wx.showModal({
        title: '需要登录',
        content: '登录后才能收藏好物，是否前往登录？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index/index' });
          }
        }
      });
      return;
    }

    if (this.data.favoriteLoading || !this.data.goods) return;

    this.setData({ favoriteLoading: true });
    try {
      const result = await api.toggleFavorite(this.goodsId);
      this.setData({
        'goods.isFavorited': result.favorited,
        'goods.likeCount': result.likeCount,
        favoriteLoading: false
      });
      wx.showToast({
        title: result.favorited ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    } catch (err) {
      this.setData({ favoriteLoading: false });
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/goods/edit/edit?id=' + this.goodsId });
  }
});

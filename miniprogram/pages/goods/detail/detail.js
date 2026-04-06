const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    goods: null,
    relatedGoods: [],
    shelfTimeText: '',
    isAdmin: false
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

  goEdit() {
    wx.navigateTo({ url: '/pages/goods/edit/edit?id=' + this.goodsId });
  }
});

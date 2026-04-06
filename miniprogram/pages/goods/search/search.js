const api = require('../../../utils/api');

Page({
  data: { keyword: '', goods: [], searched: false },
  onInput(e) { this.setData({ keyword: e.detail.value }); },
  async doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) return;
    wx.showLoading({ title: '搜索中' });
    try {
      const data = await api.getGoods({ keyword: kw, pageSize: 50 });
      this.setData({ goods: data.list || data, searched: true });
    } catch (err) {
      this.setData({ goods: [], searched: true });
    }
    wx.hideLoading();
  }
});

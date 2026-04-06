const api = require('../../../utils/api');

Page({
  data: { goods: [], page: 1, hasMore: true, loading: false },

  onLoad(options) {
    this.type = options.type || '';
    this.dimId = options.id || '';
    if (options.title) wx.setNavigationBarTitle({ title: options.title });
    this.loadGoods();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadGoods(true);
  },

  async loadGoods(append) {
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true });
    try {
      const params = { page, pageSize: 10 };
      if (this.type === 'scene') params.sceneId = this.dimId;
      if (this.type === 'room') params.roomId = this.dimId;
      if (this.type === 'collection') params.collectionId = this.dimId;
      const data = await api.getGoods(params);
      const list = data.list || data;
      this.setData({
        goods: append ? [...this.data.goods, ...list] : list,
        page, hasMore: list.length >= 10, loading: false
      });
    } catch (err) { this.setData({ loading: false }); }
  }
});

const api = require('../../../utils/api');

Page({
  data: { collection: null, goods: [], loading: false },
  onLoad(options) {
    this.collectionId = options.id;
    this.loadData();
  },
  async loadData() {
    this.setData({ loading: true });
    try {
      const collections = await api.getCollections({ id: this.collectionId });
      const collection = Array.isArray(collections) ? collections[0] : collections;
      const data = await api.getGoods({ collectionId: this.collectionId, pageSize: 50 });
      this.setData({ collection, goods: data.list || data, loading: false });
      if (collection) wx.setNavigationBarTitle({ title: collection.periodLabel || '小红书精选' });
    } catch (err) { this.setData({ loading: false }); }
  }
});

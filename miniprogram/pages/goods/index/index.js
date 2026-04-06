const api = require('../../../utils/api');
const auth = require('../../../utils/auth');

Page({
  data: {
    collections: [],
    scenes: [],
    rooms: [],
    activeRoomId: '',
    roomGoods: [],
    recommendGoods: [],
    allGoods: [],
    sortBy: 'latest',
    page: 1,
    hasMore: true,
    loading: false,
    isAdmin: false
  },

  onLoad() {
    this.setData({ isAdmin: auth.isAdmin() });
    this.loadInitialData();
  },

  onShow() {
    this.setData({ isAdmin: auth.isAdmin() });
  },

  onPullDownRefresh() {
    this.loadInitialData().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadAllGoods(true);
    }
  },

  async loadInitialData() {
    wx.showLoading({ title: '加载中' });
    try {
      const [collections, scenes, rooms] = await Promise.all([
        api.getCollections({ limit: 8 }).catch(() => []),
        api.getScenes().catch(() => []),
        api.getRooms().catch(() => [])
      ]);

      this.setData({ collections, scenes, rooms });

      // 默认选第一个房间
      if (rooms.length) {
        this.setData({ activeRoomId: rooms[0]._id });
        this.loadRoomGoods(rooms[0]._id);
      }

      // 加载编辑推荐
      this.loadRecommendGoods();
      // 加载全部好物
      this.loadAllGoods(false);
    } catch (err) {
      console.error('加载失败', err);
    }
    wx.hideLoading();
  },

  async loadRoomGoods(roomId) {
    try {
      const roomGoods = await api.getGoods({ roomId, pageSize: 6 });
      this.setData({ roomGoods: roomGoods.list || roomGoods });
    } catch (err) {
      this.setData({ roomGoods: [] });
    }
  },

  async loadRecommendGoods() {
    try {
      const data = await api.getGoods({ minRating: 8, pageSize: 6, sortBy: 'rating' });
      this.setData({ recommendGoods: data.list || data });
    } catch (err) {
      this.setData({ recommendGoods: [] });
    }
  },

  async loadAllGoods(append) {
    if (this.data.loading) return;
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true });
    try {
      const data = await api.getGoods({ page, pageSize: 10, sortBy: this.data.sortBy });
      const list = data.list || data;
      this.setData({
        allGoods: append ? [...this.data.allGoods, ...list] : list,
        page,
        hasMore: list.length >= 10,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  switchRoom(e) {
    const roomId = e.currentTarget.dataset.id;
    this.setData({ activeRoomId: roomId });
    this.loadRoomGoods(roomId);
  },

  changeSort(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({ sortBy, allGoods: [], page: 1 });
    this.loadAllGoods(false);
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/goods/search/search' });
  },

  goCollection(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/goods/collection/collection?id=' + id });
  },

  goCollectionList() {
    wx.navigateTo({ url: '/pages/goods/list/list?type=collection' });
  },

  goSceneList(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/goods/list/list?type=scene&id=' + id + '&title=' + name });
  },

  goAddGoods() {
    wx.navigateTo({ url: '/pages/goods/edit/edit' });
  }
});

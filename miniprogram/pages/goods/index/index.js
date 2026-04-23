const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const media = require('../../../utils/media');

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
    isAdmin: false,

    // Dimension manage mode (admin only)
    manageCollections: false,
    manageScenes: false,
    manageRooms: false,

    // Dimension editor (admin only)
    dimEditorVisible: false,
    dimEditorType: '',
    dimEditorId: '',
    dimEditorName: '',
    dimEditorIcon: '',
    dimEditorCoverImage: '',
    dimSaving: false
  },

  onLoad() {
    this.setData({ isAdmin: auth.isAdmin() });
    this.loadInitialData();
  },

  onShow() {
    this.setData({ isAdmin: auth.isAdmin() });
    this.exitManageMode();
  },

  onPullDownRefresh() {
    this.loadInitialData().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadAllGoods(true);
    }
  },

  exitManageMode() {
    this.setData({
      manageCollections: false,
      manageScenes: false,
      manageRooms: false
    });
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

  async reloadDimensions() {
    try {
      const [collections, scenes, rooms] = await Promise.all([
        api.getCollections({ limit: 8 }).catch(() => []),
        api.getScenes().catch(() => []),
        api.getRooms().catch(() => [])
      ]);
      const nextData = { collections, scenes, rooms };

      // If current room was deleted, pick the first one.
      const currentRoomId = this.data.activeRoomId;
      const stillExists = rooms.some(r => r._id === currentRoomId);
      if (!stillExists) {
        nextData.activeRoomId = rooms.length ? rooms[0]._id : '';
      }

      this.setData(nextData);
      if (nextData.activeRoomId && nextData.activeRoomId !== currentRoomId) {
        this.loadRoomGoods(nextData.activeRoomId);
      }
    } catch (err) {}
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
    if (this.data.manageRooms && this.data.isAdmin) {
      this.openDimEditor('rooms', roomId);
      return;
    }
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
    if (this.data.manageCollections && this.data.isAdmin) {
      this.openDimEditor('collections', id);
      return;
    }
    wx.navigateTo({ url: '/pages/goods/collection/collection?id=' + id });
  },

  goCollectionList() {
    wx.navigateTo({ url: '/pages/goods/list/list?type=collection' });
  },

  goSceneList(e) {
    const { id, name } = e.currentTarget.dataset;
    if (this.data.manageScenes && this.data.isAdmin) {
      this.openDimEditor('scenes', id);
      return;
    }
    wx.navigateTo({ url: '/pages/goods/list/list?type=scene&id=' + id + '&title=' + name });
  },

  goAddGoods() {
    wx.navigateTo({ url: '/pages/goods/edit/edit' });
  },

  // ===== Dimension management (admin only) =====
  enterManageCollections() {
    if (!this.data.isAdmin) return;
    this.setData({ manageCollections: true, manageScenes: false, manageRooms: false });
  },
  enterManageScenes() {
    if (!this.data.isAdmin) return;
    this.setData({ manageCollections: false, manageScenes: true, manageRooms: false });
  },
  enterManageRooms() {
    if (!this.data.isAdmin) return;
    this.setData({ manageCollections: false, manageScenes: false, manageRooms: true });
  },
  exitManageCollections() { this.setData({ manageCollections: false }); },
  exitManageScenes() { this.setData({ manageScenes: false }); },
  exitManageRooms() { this.setData({ manageRooms: false }); },

  findDim(type, id) {
    const map = {
      collections: this.data.collections,
      scenes: this.data.scenes,
      rooms: this.data.rooms
    };
    return (map[type] || []).find(item => item && item._id === id);
  },

  openDimEditor(type, id) {
    if (!this.data.isAdmin) return;
    const item = this.findDim(type, id);
    if (!item) return;
    this.setData({
      dimEditorVisible: true,
      dimEditorType: type,
      dimEditorId: id,
      dimEditorName: type === 'collections' ? (item.title || '') : (item.name || ''),
      dimEditorIcon: item.icon || '',
      dimEditorCoverImage: item.coverImage || '',
      dimSaving: false
    });
  },

  closeDimEditor() {
    this.setData({ dimEditorVisible: false, dimSaving: false });
  },

  onDimNameInput(e) { this.setData({ dimEditorName: e.detail.value }); },
  onDimIconInput(e) { this.setData({ dimEditorIcon: e.detail.value }); },

  async chooseDimCover() {
    if (!this.data.isAdmin || !['collections', 'scenes', 'rooms'].includes(this.data.dimEditorType)) return;
    const cropScale = this.data.dimEditorType === 'collections' ? '16:9' : '1:1';
    try {
      const filePath = await media.selectEditableImage({ cropScale });
      if (!filePath) return;
      wx.showLoading({ title: '上传中' });
      const ext = (filePath.split('.').pop() || 'jpg').split('?')[0];
      const cloudPath = 'dimensions/' + this.data.dimEditorType + '/' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.' + ext;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath });
      this.setData({ dimEditorCoverImage: up.fileID });
    } catch (err) {
      if (!media.isCancelError(err)) {
        wx.showToast({ title: media.getErrorMessage(err) || '上传失败', icon: 'none' });
      }
    }
    wx.hideLoading();
  },

  async saveDimEdit() {
    if (!this.data.isAdmin || this.data.dimSaving) return;
    const type = this.data.dimEditorType;
    const id = this.data.dimEditorId;

    const name = (this.data.dimEditorName || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    const updates = {};
    if (type === 'collections') {
      updates.title = name;
      updates.coverImage = this.data.dimEditorCoverImage || '';
    } else {
      updates.name = name;
      updates.icon = (this.data.dimEditorIcon || '').trim();
      if (type === 'scenes' || type === 'rooms') {
        updates.coverImage = this.data.dimEditorCoverImage || '';
      }
    }

    this.setData({ dimSaving: true });
    wx.showLoading({ title: '保存中' });
    try {
      const updated = await api.updateDimension(type, id, updates);
      // If cloud function is not redeployed, new fields like coverImage may be silently ignored.
      if (Object.prototype.hasOwnProperty.call(updates, 'coverImage') && updates.coverImage) {
        if (!updated || !updated.coverImage) {
          this.setData({ dimSaving: false });
          wx.hideLoading();
          wx.showModal({
            title: '封面未写入数据库',
            content: '已上传图片，但云函数返回里没有 coverImage 字段。请在微信开发者工具重新上传并部署云函数 updateDimension 后再试。',
            showCancel: false
          });
          return;
        }
      }
      await this.reloadDimensions();
      this.setData({ dimEditorVisible: false, dimSaving: false });
      this.exitManageMode();
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      this.setData({ dimSaving: false });
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async deleteDim(type, id) {
    if (!this.data.isAdmin) return;
    const item = this.findDim(type, id);
    const label = type === 'collections' ? '小红书集合' : (type === 'scenes' ? '场景' : '房间');
    const name = type === 'collections' ? (item && item.title) : (item && item.name);
    wx.showModal({
      title: '确认删除',
      content: `确定删除${label}${name ? '「' + name + '」' : ''}吗？删除不会自动解除商品上的关联。`,
      confirmColor: '#E85D5D',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中' });
        try {
          await api.deleteDimension(type, id);
          await this.reloadDimensions();
          this.exitManageMode();
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        }
        wx.hideLoading();
      }
    });
  },

  onEditDim(e) {
    if (!this.data.isAdmin) return;
    const { type, id } = e.currentTarget.dataset;
    this.openDimEditor(type, id);
  },

  onDeleteDim(e) {
    if (!this.data.isAdmin) return;
    const { type, id } = e.currentTarget.dataset;
    this.deleteDim(type, id);
  },

  noop() {}
});

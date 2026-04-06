const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    isEdit: false,
    form: {
      name: '', subtitle: '', description: '', images: [],
      price: '', purchaseLink: '', purchasePlatform: 'taobao',
      rating: 8, shelfTime: '', status: 'draft',
      collectionIds: [], sceneIds: [], roomIds: [], tagIds: []
    },
    platforms: [
      { value: 'taobao', label: '淘宝' },
      { value: 'jd', label: '京东' },
      { value: 'pdd', label: '拼多多' },
      { value: 'other', label: '其他' }
    ],
    platformIndex: 0,
    allCollections: [], allScenes: [], allRooms: [], allTags: []
  },

  onLoad(options) {
    if (!auth.isAdmin()) {
      wx.showToast({ title: '无权限', icon: 'none' });
      wx.navigateBack();
      return;
    }
    // 设置默认上架时间为今天
    this.setData({ 'form.shelfTime': formatDate(new Date()) });

    this.loadDimensions();

    if (options.id) {
      this.setData({ isEdit: true });
      this.goodsId = options.id;
      this.loadGoods(options.id);
    }
  },

  async loadDimensions() {
    try {
      const [allCollections, allScenes, allRooms, allTags] = await Promise.all([
        api.getCollections().catch(() => []),
        api.getScenes().catch(() => []),
        api.getRooms().catch(() => []),
        api.getTags().catch(() => [])
      ]);
      this.setData({ allCollections, allScenes, allRooms, allTags });
    } catch (err) {}
  },

  async loadGoods(id) {
    try {
      const goods = await api.getGoodsDetail(id);
      const pIdx = this.data.platforms.findIndex(p => p.value === goods.purchasePlatform);
      this.setData({
        form: {
          name: goods.name || '',
          subtitle: goods.subtitle || '',
          description: goods.description || '',
          images: goods.images || [],
          price: goods.price ? String(goods.price) : '',
          purchaseLink: goods.purchaseLink || '',
          purchasePlatform: goods.purchasePlatform || 'taobao',
          rating: goods.rating || 8,
          shelfTime: formatDate(goods.shelfTime),
          status: goods.status || 'draft',
          collectionIds: goods.collectionIds || [],
          sceneIds: goods.sceneIds || [],
          roomIds: goods.roomIds || [],
          tagIds: goods.tagIds || []
        },
        platformIndex: pIdx >= 0 ? pIdx : 0
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onRatingChange(e) { this.setData({ 'form.rating': e.detail.value }); },

  onPlatformChange(e) {
    const idx = Number(e.detail.value);
    this.setData({ platformIndex: idx, 'form.purchasePlatform': this.data.platforms[idx].value });
  },

  onDateChange(e) { this.setData({ 'form.shelfTime': e.detail.value }); },

  toggleDimension(e) {
    const { field, id } = e.currentTarget.dataset;
    const arr = [...this.data.form[field]];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(id);
    this.setData({ ['form.' + field]: arr });
  },

  chooseImage() {
    const remain = 9 - this.data.form.images.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.uploadImages(newImages);
      }
    });
  },

  async uploadImages(tempPaths) {
    wx.showLoading({ title: '上传中' });
    const uploaded = [];
    for (const path of tempPaths) {
      try {
        const ext = path.split('.').pop();
        const cloudPath = 'goods/' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.' + ext;
        const res = await wx.cloud.uploadFile({ cloudPath, filePath: path });
        uploaded.push(res.fileID);
      } catch (err) {
        console.error('上传失败', err);
      }
    }
    this.setData({ 'form.images': [...this.data.form.images, ...uploaded] });
    wx.hideLoading();
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = [...this.data.form.images];
    images.splice(idx, 1);
    this.setData({ 'form.images': images });
  },

  validate() {
    const { name, description, images, price, purchaseLink, rating, shelfTime } = this.data.form;
    if (!name.trim()) return '请输入好物名称';
    if (!images.length) return '请上传至少一张图片';
    if (!description.trim()) return '请输入好物描述';
    if (!price || isNaN(Number(price))) return '请输入有效价格';
    if (!purchaseLink.trim()) return '请输入商品链接';
    if (!shelfTime) return '请选择上架时间';
    return null;
  },

  async saveDraft() {
    await this.doSave('draft');
  },

  async publish() {
    const err = this.validate();
    if (err) { wx.showToast({ title: err, icon: 'none' }); return; }
    await this.doSave('published');
  },

  async doSave(status) {
    const form = { ...this.data.form, status, price: Number(this.data.form.price) };
    if (this.data.isEdit) form._id = this.goodsId;

    wx.showLoading({ title: '保存中' });
    try {
      await api.saveGoods(form);
      wx.showToast({ title: status === 'published' ? '发布成功' : '已保存草稿', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async deleteGoods() {
    const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复，确定删除？', confirmColor: '#E85D5D' });
    if (!res.confirm) return;
    wx.showLoading({ title: '删除中' });
    try {
      await api.deleteGoods(this.goodsId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});

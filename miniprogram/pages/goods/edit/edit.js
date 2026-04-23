const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');
const media = require('../../../utils/media');

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
    allCollections: [], allScenes: [], allRooms: [], allTags: [],
    selectedCollections: [], selectedScenes: [], selectedRooms: [], selectedTags: [],
    inlineAddType: '',
    inlineAddName: '',
    inlineAddIcon: '',
    inlineAddCoverImage: ''
  },

  onLoad(options) {
    if (!auth.isAdmin()) {
      wx.showToast({ title: '无权限', icon: 'none' });
      wx.navigateBack();
      return;
    }
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
      const [collections, scenes, rooms, tags] = await Promise.all([
        api.getCollections().catch(() => []),
        api.getScenes().catch(() => []),
        api.getRooms().catch(() => []),
        api.getTags().catch(() => [])
      ]);
      this.setData({
        allCollections: Array.isArray(collections) ? collections : (collections.list || []),
        allScenes: Array.isArray(scenes) ? scenes : (scenes.list || []),
        allRooms: Array.isArray(rooms) ? rooms : (rooms.list || []),
        allTags: Array.isArray(tags) ? tags : (tags.list || [])
      });
      this.syncSelectedDimensions();
    } catch (err) {
      console.error('loadDimensions error', err);
    }
  },

  async loadGoods(id) {
    try {
      const goods = await api.getGoodsDetail(id);
      const pIdx = this.data.platforms.findIndex(p => p.value === goods.purchasePlatform);
      this.setData({
        form: {
          name: goods.name || '', subtitle: goods.subtitle || '',
          description: goods.description || '', images: goods.images || [],
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
      this.syncSelectedDimensions();
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  syncSelectedDimensions() {
    const {
      form,
      allCollections,
      allScenes,
      allRooms,
      allTags
    } = this.data;

    const pickSelected = (list, ids) => {
      if (!Array.isArray(list) || !Array.isArray(ids) || !ids.length) return [];
      const map = {};
      list.forEach(item => { if (item && item._id) map[item._id] = item; });
      return ids.map(id => map[id]).filter(Boolean);
    };

    this.setData({
      selectedCollections: pickSelected(allCollections, form.collectionIds),
      selectedScenes: pickSelected(allScenes, form.sceneIds),
      selectedRooms: pickSelected(allRooms, form.roomIds),
      selectedTags: pickSelected(allTags, form.tagIds)
    });
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value });
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
    this.syncSelectedDimensions();
  },

  // ===== 内联新增维度（通过云函数） =====
  toggleInlineAdd(e) {
    this.setData({
      inlineAddType: e.currentTarget.dataset.type,
      inlineAddName: '', inlineAddIcon: '', inlineAddCoverImage: ''
    });
  },
  cancelInlineAdd() {
    this.setData({ inlineAddType: '', inlineAddName: '', inlineAddIcon: '', inlineAddCoverImage: '' });
  },
  onInlineNameInput(e) { this.setData({ inlineAddName: e.detail.value }); },
  onInlineIconInput(e) { this.setData({ inlineAddIcon: e.detail.value }); },

  async chooseInlineDimCover() {
    const type = this.data.inlineAddType;
    if (!['collections', 'scenes', 'rooms'].includes(type)) return;
    const cropScale = type === 'collections' ? '16:9' : '1:1';
    try {
      const filePath = await media.selectEditableImage({ cropScale });
      if (!filePath) return;
      wx.showLoading({ title: '上传中' });
      const ext = (filePath.split('.').pop() || 'jpg').split('?')[0];
      const cloudPath = 'dimensions/' + type + '/' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.' + ext;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath });
      this.setData({ inlineAddCoverImage: up.fileID });
    } catch (err) {
      if (!media.isCancelError(err)) {
        wx.showToast({ title: media.getErrorMessage(err) || '上传失败', icon: 'none' });
      }
    }
    wx.hideLoading();
  },

  async confirmInlineAdd() {
    const { inlineAddType, inlineAddName, inlineAddIcon, inlineAddCoverImage } = this.data;
    if (!inlineAddName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '添加中' });
    try {
      let doc = {};
      if (inlineAddType === 'collections') {
        doc.title = inlineAddName.trim();
        doc.periodLabel = inlineAddName.trim();
        doc.coverImage = inlineAddCoverImage || '';
      } else if (inlineAddType === 'tags') {
        doc.name = inlineAddName.trim();
      } else {
        doc.name = inlineAddName.trim();
        doc.icon = inlineAddIcon.trim() || '';
        doc.coverImage = inlineAddCoverImage || '';
      }

      // 通过云函数写入（绕过客户端权限限制）
      const newDoc = await api.addDimension(inlineAddType, doc);
      if (inlineAddCoverImage && !(newDoc && newDoc.coverImage)) {
        wx.showModal({
          title: '封面未写入数据库',
          content: '已上传图片，但新增维度返回里没有 coverImage 字段。请重新上传并部署云函数 addDimension 后再试。',
          showCancel: false
        });
      }

      const fieldMap = {
        collections: 'allCollections', scenes: 'allScenes',
        rooms: 'allRooms', tags: 'allTags'
      };
      const formFieldMap = {
        collections: 'collectionIds',
        scenes: 'sceneIds',
        rooms: 'roomIds',
        tags: 'tagIds'
      };
      const list = [...this.data[fieldMap[inlineAddType]], newDoc];
      const nextIds = [...this.data.form[formFieldMap[inlineAddType]], newDoc._id];
      this.setData({
        [fieldMap[inlineAddType]]: list,
        ['form.' + formFieldMap[inlineAddType]]: nextIds,
        inlineAddType: '', inlineAddName: '', inlineAddIcon: '', inlineAddCoverImage: ''
      });
      this.syncSelectedDimensions();

      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      console.error('添加维度失败', err);
      wx.showToast({ title: '添加失败: ' + (err.message || ''), icon: 'none' });
    }
  },

  removeSelectedDimension(e) {
    const { field, id } = e.currentTarget.dataset;
    const list = [...this.data.form[field]].filter(itemId => itemId !== id);
    this.setData({ ['form.' + field]: list });
    this.syncSelectedDimensions();
  },

  // ===== 图片 =====
  chooseImage() {
    this.chooseGoodsImage();
  },
  async chooseGoodsImage() {
    if (this.data.form.images.length >= 9) return;
    try {
      const filePath = await media.selectEditableImage({ cropScale: '4:3' });
      if (!filePath) return;
      await this.uploadImages([filePath]);
    } catch (err) {
      if (!media.isCancelError(err)) {
        wx.showToast({ title: media.getErrorMessage(err) || '选图失败', icon: 'none' });
      }
    }
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
      } catch (err) { console.error('上传失败', err); }
    }
    this.setData({ 'form.images': [...this.data.form.images, ...uploaded] });
    wx.hideLoading();
  },
  removeImage(e) {
    const images = [...this.data.form.images];
    images.splice(e.currentTarget.dataset.index, 1);
    this.setData({ 'form.images': images });
  },

  // ===== 保存 =====
  validate() {
    const f = this.data.form;
    if (!f.name.trim()) return '请输入好物名称';
    if (!f.images.length) return '请上传至少一张图片';
    if (!f.description.trim()) return '请输入好物描述';
    if (!f.price || isNaN(Number(f.price))) return '请输入有效价格';
    if (!f.purchaseLink.trim()) return '请输入商品链接';
    if (!f.shelfTime) return '请选择上架时间';
    return null;
  },
  async saveDraft() { await this.doSave('draft'); },
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
    } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }); }
    wx.hideLoading();
  }
});

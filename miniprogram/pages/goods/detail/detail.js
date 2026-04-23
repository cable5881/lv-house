const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate } = require('../../../utils/util');
const { drawGoodsPoster } = require('../../../utils/poster');

Page({
  data: {
    goods: null,
    relatedGoods: [],
    shelfTimeText: '',
    isAdmin: false,
    favoriteLoading: false,

    comments: [],
    commentsPage: 1,
    commentsHasMore: true,
    commentsLoading: false,
    commentSubmitting: false,
    commentContent: '',
    replyTo: null,

    posterVisible: false,
    posterLoading: false,
    posterTempFilePath: ''
  },

  onLoad(options) {
    this.goodsId = options.id || decodeURIComponent(options.scene || '');
    this.setData({ isAdmin: auth.isAdmin() });
    this.loadDetail();
    if (wx.showShareMenu) {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    }
  },

  onShow() {
    this.setData({ isAdmin: auth.isAdmin() });
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
      this.loadComments();
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

  decorateComments(list) {
    const app = getApp();
    const openid = app.globalData.openid;
    const isAdmin = app.globalData.isAdmin;
    const decorateItem = (item) => ({
      ...item,
      displayDate: formatDate(item.createdAt),
      canDelete: !!(item && (item.userOpenid === openid || isAdmin)),
      userSnapshot: item.userSnapshot || {},
      replyToSnapshot: item.replyToSnapshot || {},
      replies: (item.replies || []).map(reply => ({
        ...reply,
        displayDate: formatDate(reply.createdAt),
        canDelete: !!(reply && (reply.userOpenid === openid || isAdmin)),
        userSnapshot: reply.userSnapshot || {},
        replyToSnapshot: reply.replyToSnapshot || {}
      }))
    });
    return (list || []).map(decorateItem);
  },

  async loadComments(append) {
    if (this.data.commentsLoading) return;
    const page = append ? this.data.commentsPage + 1 : 1;
    this.setData({ commentsLoading: true });
    try {
      const data = await api.getComments({
        goodsId: this.goodsId,
        page,
        pageSize: 10
      });
      const list = this.decorateComments(data.list || []);
      this.setData({
        comments: append ? this.data.comments.concat(list) : list,
        commentsPage: page,
        commentsHasMore: !!data.hasMore,
        commentsLoading: false
      });
    } catch (err) {
      this.setData({ commentsLoading: false });
      if (!append) {
        this.setData({
          comments: [],
          commentsPage: 1,
          commentsHasMore: true
        });
      }
    }
  },

  loadMoreComments() {
    if (this.data.commentsHasMore && !this.data.commentsLoading) {
      this.loadComments(true);
    }
  },

  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value });
  },

  ensureCommentPermission() {
    if (auth.isLoggedIn()) return true;
    wx.showModal({
      title: '需要登录',
      content: '登录后才能评论和回复，是否前往登录？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/login/index/index' });
        }
      }
    });
    return false;
  },

  focusComment() {
    this.ensureCommentPermission();
  },

  replyComment(e) {
    if (!this.ensureCommentPermission()) return;
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      replyTo: {
        id,
        name: name || '该用户'
      }
    });
  },

  clearReply() {
    this.setData({ replyTo: null });
  },

  async submitComment() {
    if (!this.ensureCommentPermission()) return;
    if (this.data.commentSubmitting) return;
    const content = String(this.data.commentContent || '').trim();
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    this.setData({ commentSubmitting: true });
    wx.showLoading({ title: '发布中' });
    try {
      await api.createComment({
        goodsId: this.goodsId,
        content,
        parentId: this.data.replyTo ? this.data.replyTo.id : ''
      });
      this.setData({
        commentContent: '',
        replyTo: null,
        commentSubmitting: false
      });
      await this.loadComments();
      wx.showToast({ title: '评论成功', icon: 'success' });
    } catch (err) {
      this.setData({ commentSubmitting: false });
      wx.showToast({ title: err.message || '评论失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async deleteComment(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除评论',
      content: '删除后将展示为“该评论已删除”，确认继续吗？',
      confirmColor: '#E85D5D',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中' });
        try {
          await api.deleteComment(id);
          await this.loadComments();
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        }
        wx.hideLoading();
      }
    });
  },

  async openPoster() {
    if (!this.data.goods) return;
    if (this.data.posterTempFilePath) {
      this.setData({ posterVisible: true });
      return;
    }

    this.setData({ posterLoading: true, posterVisible: true });
    wx.showLoading({ title: '生成海报中' });
    try {
      const codeData = await api.getPosterCode(this.goodsId);
      const posterTempFilePath = await drawGoodsPoster({
        page: this,
        canvasId: 'posterCanvas',
        goods: this.data.goods,
        codeFileID: codeData.fileID
      });
      this.setData({
        posterTempFilePath,
        posterLoading: false
      });
    } catch (err) {
      this.setData({
        posterVisible: false,
        posterLoading: false
      });
      wx.showToast({ title: err.message || '海报生成失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  closePoster() {
    this.setData({ posterVisible: false });
  },

  previewPoster() {
    if (!this.data.posterTempFilePath) return;
    wx.previewImage({
      current: this.data.posterTempFilePath,
      urls: [this.data.posterTempFilePath]
    });
  },

  savePoster() {
    if (!this.data.posterTempFilePath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterTempFilePath,
      success() {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail(err) {
        const msg = String((err && err.errMsg) || '');
        if (/auth/i.test(msg) || /deny/i.test(msg)) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中允许保存到相册后重试',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
          return;
        }
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    const goods = this.data.goods || {};
    return {
      title: goods.name || '租房好物推荐LAB',
      path: `/pages/goods/detail/detail?id=${this.goodsId}`,
      imageUrl: (goods.images || [])[0] || ''
    };
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/goods/edit/edit?id=' + this.goodsId });
  }
});

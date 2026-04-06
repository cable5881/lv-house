/**
 * 云函数调用封装
 */
const callCloud = (name, data = {}) => {
  return wx.cloud.callFunction({
    name,
    data
  }).then(res => {
    if (res.result && res.result.code === 0) {
      return res.result.data;
    }
    throw new Error(res.result ? res.result.message : '云函数调用失败');
  });
};

module.exports = {
  // 登录
  login() {
    return callCloud('login');
  },

  // 好物列表
  getGoods(params = {}) {
    return callCloud('getGoods', params);
  },

  // 好物详情
  getGoodsDetail(id) {
    return callCloud('getGoodsDetail', { id });
  },

  // 保存好物（新增/编辑）
  saveGoods(data) {
    return callCloud('saveGoods', data);
  },

  // 删除好物
  deleteGoods(id) {
    return callCloud('deleteGoods', { id });
  },

  // 获取集合列表
  getCollections(params = {}) {
    return callCloud('getCollections', params);
  },

  // 获取场景列表
  getScenes() {
    return callCloud('getScenes');
  },

  // 获取房间列表
  getRooms() {
    return callCloud('getRooms');
  },

  // 获取标签列表
  getTags() {
    return callCloud('getTags');
  },

  // 更新用户信息
  updateUserInfo(data) {
    return callCloud('updateUserInfo', data);
  }
};

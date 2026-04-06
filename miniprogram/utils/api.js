/**
 * 云函数调用封装
 */
const callCloud = (name, data = {}) => {
  return wx.cloud.callFunction({
    name,
    data
  }).then(res => {
    console.log('[云函数] ' + name + ' 返回:', res.result);
    if (res.result && res.result.code === 0) {
      return res.result.data;
    }
    const msg = res.result ? res.result.message : '云函数返回异常';
    console.error('[云函数] ' + name + ' 业务错误:', msg);
    throw new Error(msg);
  }).catch(err => {
    console.error('[云函数] ' + name + ' 调用失败:', err);
    throw err;
  });
};

module.exports = {
  login() { return callCloud('login'); },
  getGoods(params) { return callCloud('getGoods', params || {}); },
  getGoodsDetail(id) { return callCloud('getGoodsDetail', { id }); },
  saveGoods(data) { return callCloud('saveGoods', data); },
  deleteGoods(id) { return callCloud('deleteGoods', { id }); },
  getCollections(params) { return callCloud('getCollections', params || {}); },
  getScenes() { return callCloud('getScenes'); },
  getRooms() { return callCloud('getRooms'); },
  getTags() { return callCloud('getTags'); },
  updateUserInfo(data) { return callCloud('updateUserInfo', data); },
  addDimension(collectionName, doc) { return callCloud('addDimension', { collectionName, doc }); }
};

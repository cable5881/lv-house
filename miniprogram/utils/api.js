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
    const rawMsg = String((err && (err.errMsg || err.message)) || '');
    if (/FUNCTION_NOT_FOUND|FunctionName parameter could not be found/i.test(rawMsg)) {
      throw new Error(`云函数 ${name} 未部署，请在微信开发者工具中上传并部署后重试`);
    }
    throw err;
  });
};

module.exports = {
  login() { return callCloud('login'); },
  getGoods(params) { return callCloud('getGoods', params || {}); },
  getGoodsDetail(id) { return callCloud('getGoodsDetail', { id }); },
  getFavorites(params) { return callCloud('getFavorites', params || {}); },
  toggleFavorite(goodsId) { return callCloud('toggleFavorite', { goodsId }); },
  saveGoods(data) { return callCloud('saveGoods', data); },
  deleteGoods(id) { return callCloud('deleteGoods', { id }); },
  getCollections(params) { return callCloud('getCollections', params || {}); },
  getScenes() { return callCloud('getScenes'); },
  getRooms() { return callCloud('getRooms'); },
  getTags() { return callCloud('getTags'); },
  updateUserInfo(data) { return callCloud('updateUserInfo', data); },
  addDimension(collectionName, doc) { return callCloud('addDimension', { collectionName, doc }); }
};

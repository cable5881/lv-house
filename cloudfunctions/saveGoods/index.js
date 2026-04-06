const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();

  try {
    // 校验管理员权限
    const { data: users } = await db.collection('users').where({ _openid: wxContext.OPENID, role: 'admin' }).get();
    if (!users.length) return { code: 403, message: '无权限' };

    const { _id, ...goodsData } = event;
    goodsData.updatedAt = db.serverDate();
    goodsData.price = Number(goodsData.price) || 0;
    goodsData.rating = Math.max(1, Math.min(10, Number(goodsData.rating) || 8));

    if (_id) {
      // 编辑
      await db.collection('goods').doc(_id).update({ data: goodsData });
      return { code: 0, data: { _id } };
    } else {
      // 新增
      goodsData.createdAt = db.serverDate();
      goodsData.viewCount = 0;
      goodsData.likeCount = 0;
      goodsData.sortOrder = 0;
      const res = await db.collection('goods').add({ data: goodsData });
      return { code: 0, data: { _id: res._id } };
    }
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

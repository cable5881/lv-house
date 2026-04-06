const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 验证管理员权限
    const { data: users } = await db.collection('users').where({ _openid: openid }).get();
    if (!users.length || users[0].role !== 'admin') {
      return { code: -2, message: '无权限' };
    }

    const { collectionName, doc } = event;
    const allowed = ['collections', 'scenes', 'rooms', 'tags'];
    if (!allowed.includes(collectionName)) {
      return { code: -3, message: '不允许的集合' };
    }

    doc.createdAt = db.serverDate();
    const res = await db.collection(collectionName).add({ data: doc });

    return { code: 0, data: { _id: res._id, ...doc } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

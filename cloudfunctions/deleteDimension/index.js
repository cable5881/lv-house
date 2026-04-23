const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (!users.length || users[0].role !== 'admin') {
      return { code: 403, message: '无权限' };
    }

    const { collectionName, id } = event || {};
    const allowed = ['collections', 'scenes', 'rooms', 'tags'];
    if (!allowed.includes(collectionName)) {
      return { code: 400, message: '不允许的集合' };
    }
    if (!id) {
      return { code: 400, message: '缺少id' };
    }

    await db.collection(collectionName).doc(id).remove();
    return { code: 0, data: {} };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  try {
    const { data: users } = await db.collection('users').where({ _openid: wxContext.OPENID, role: 'admin' }).get();
    if (!users.length) return { code: 403, message: '无权限' };

    await db.collection('goods').doc(event.id).remove();
    return { code: 0, data: {} };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

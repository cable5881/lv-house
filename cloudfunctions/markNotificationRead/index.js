const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { notificationId } = event || {};

  if (!notificationId) {
    return { code: 400, message: '缺少通知ID' };
  }

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    const { data } = await db.collection('notifications').doc(notificationId).get();
    if (!data || !data._id) {
      return { code: 404, message: '通知不存在' };
    }
    if (data.userOpenid !== openid) {
      return { code: 403, message: '无权限操作该通知' };
    }

    await db.collection('notifications').doc(notificationId).update({
      data: {
        isRead: true
      }
    });

    return { code: 0, data: { notificationId } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


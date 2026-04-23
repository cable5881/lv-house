const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { commentId } = event || {};

  if (!commentId) {
    return { code: 400, message: '缺少评论ID' };
  }

  try {
    const [{ data: users }, commentRes] = await Promise.all([
      db.collection('users').where({ _openid: openid }).limit(1).get(),
      db.collection('comments').doc(commentId).get()
    ]);

    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    const currentUser = users[0];
    const comment = commentRes.data;
    if (!comment || !comment._id) {
      return { code: 404, message: '评论不存在' };
    }

    const canDelete = comment.userOpenid === openid || currentUser.role === 'admin';
    if (!canDelete) {
      return { code: 403, message: '无权限删除该评论' };
    }

    await db.collection('comments').doc(commentId).update({
      data: {
        status: 'deleted',
        content: '',
        updatedAt: db.serverDate()
      }
    });

    return { code: 0, data: { commentId } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


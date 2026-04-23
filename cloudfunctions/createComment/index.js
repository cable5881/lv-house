const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const buildUserSnapshot = (user, openid) => ({
  openid,
  nickName: user && user.nickName ? user.nickName : '用户',
  avatarUrl: user && user.avatarUrl ? user.avatarUrl : '',
  role: user && user.role ? user.role : 'user'
});

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { goodsId, content, parentId = '' } = event || {};

  if (!goodsId) {
    return { code: 400, message: '缺少商品ID' };
  }

  const safeContent = String(content || '').trim();
  if (!safeContent) {
    return { code: 400, message: '评论内容不能为空' };
  }
  if (safeContent.length > 300) {
    return { code: 400, message: '评论内容最多300字' };
  }

  try {
    const [{ data: users }, goodsRes] = await Promise.all([
      db.collection('users').where({ _openid: openid }).limit(1).get(),
      db.collection('goods').doc(goodsId).get()
    ]);

    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    const goods = goodsRes.data;
    if (!goods || goods.status !== 'published') {
      return { code: 404, message: '商品不存在或不可评论' };
    }

    const user = users[0];
    const userSnapshot = buildUserSnapshot(user, openid);
    let rootId = '';
    let replyToOpenid = '';
    let replyToCommentId = '';
    let replyToSnapshot = null;

    if (parentId) {
      const { data: parentComment } = await db.collection('comments').doc(parentId).get();
      if (!parentComment || !parentComment._id) {
        return { code: 404, message: '回复的评论不存在' };
      }
      rootId = parentComment.rootId || parentComment._id;
      replyToOpenid = parentComment.userOpenid || '';
      replyToCommentId = parentComment._id;
      replyToSnapshot = parentComment.userSnapshot || null;
    }

    const now = db.serverDate();
    const doc = {
      goodsId,
      content: safeContent,
      parentId: parentId || '',
      rootId,
      userOpenid: openid,
      userSnapshot,
      replyToOpenid,
      replyToCommentId,
      replyToSnapshot,
      status: 'normal',
      createdAt: now,
      updatedAt: now
    };

    const addRes = await db.collection('comments').add({ data: doc });
    const newComment = { _id: addRes._id, ...doc };

    if (parentId && replyToOpenid && replyToOpenid !== openid) {
      const notifyDoc = {
        userOpenid: replyToOpenid,
        type: 'reply_to_my_comment',
        title: '收到新的评论回复',
        content: safeContent,
        relatedGoodsId: goodsId,
        relatedCommentId: addRes._id,
        actorSnapshot: userSnapshot,
        isRead: false,
        createdAt: now
      };

      await db.collection('notifications').add({ data: notifyDoc });
    }

    return {
      code: 0,
      data: {
        ...newComment,
        replies: []
      }
    };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


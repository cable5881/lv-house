const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const isMissingCollection = (err) => /database collection not exists|Db or Table not exist:\s*notifications/i.test(String((err && err.message) || err || ''));

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 20 } = event || {};

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 20));
  const skip = (safePage - 1) * safePageSize;

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    try {
      const [listRes, unreadRes] = await Promise.all([
        db.collection('notifications')
          .where({ userOpenid: openid })
          .orderBy('createdAt', 'desc')
          .skip(skip)
          .limit(safePageSize)
          .get(),
        db.collection('notifications')
          .where({ userOpenid: openid, isRead: false })
          .count()
      ]);

      const list = listRes.data || [];
      return {
        code: 0,
        data: {
          list,
          unreadCount: unreadRes.total || 0,
          page: safePage,
          pageSize: safePageSize,
          hasMore: list.length >= safePageSize
        }
      };
    } catch (err) {
      if (isMissingCollection(err)) {
        return {
          code: 0,
          data: {
            list: [],
            unreadCount: 0,
            page: safePage,
            pageSize: safePageSize,
            hasMore: false
          }
        };
      }
      throw err;
    }
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const isMissingCollection = (err) => /database collection not exists|Db or Table not exist:\s*comments/i.test(String((err && err.message) || err || ''));

const normalizeComment = (item) => {
  if (!item) return item;
  return {
    ...item,
    isDeleted: item.status === 'deleted' || item.status === 'hidden',
    content: item.status === 'normal' ? item.content : '该评论已删除'
  };
};

exports.main = async (event) => {
  const { goodsId, page = 1, pageSize = 20 } = event || {};

  if (!goodsId) {
    return { code: 400, message: '缺少商品ID' };
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 20));
  const skip = (safePage - 1) * safePageSize;

  try {
    let roots = [];
    try {
      const rootRes = await db.collection('comments')
        .where({ goodsId, parentId: '' })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(safePageSize)
        .get();
      roots = rootRes.data || [];
    } catch (err) {
      if (isMissingCollection(err)) {
        return {
          code: 0,
          data: { list: [], page: safePage, pageSize: safePageSize, hasMore: false }
        };
      }
      throw err;
    }

    if (!roots.length) {
      return {
        code: 0,
        data: { list: [], page: safePage, pageSize: safePageSize, hasMore: false }
      };
    }

    const rootIds = roots.map(item => item._id);
    let replies = [];
    const repliesRes = await db.collection('comments')
      .where({
        goodsId,
        rootId: _.in(rootIds)
      })
      .orderBy('createdAt', 'asc')
      .get();
    replies = (repliesRes.data || []).filter(item => item.parentId);

    const replyMap = {};
    replies.forEach(item => {
      const bucket = replyMap[item.rootId] || [];
      bucket.push(normalizeComment(item));
      replyMap[item.rootId] = bucket;
    });

    const list = roots.map(item => ({
      ...normalizeComment(item),
      replies: replyMap[item._id] || []
    }));

    return {
      code: 0,
      data: {
        list,
        page: safePage,
        pageSize: safePageSize,
        hasMore: roots.length >= safePageSize
      }
    };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


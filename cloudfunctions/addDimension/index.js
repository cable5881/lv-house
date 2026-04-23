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

    // Fill defaults so old/new records are consistent with PRD queries.
    const nextDoc = { ...(doc || {}) };
    const now = db.serverDate();
    nextDoc.createdAt = now;
    nextDoc.updatedAt = now;

    if (collectionName === 'collections') {
      if (nextDoc.status === undefined) nextDoc.status = 'published';
      if (nextDoc.publishDate === undefined) nextDoc.publishDate = now;
      if (nextDoc.sortOrder === undefined) nextDoc.sortOrder = 0;
      if (nextDoc.coverImage === undefined) nextDoc.coverImage = '';
      if (nextDoc.periodLabel === undefined && nextDoc.title) nextDoc.periodLabel = nextDoc.title;
      if (nextDoc.title === undefined && nextDoc.periodLabel) nextDoc.title = nextDoc.periodLabel;
    } else if (collectionName === 'scenes') {
      if (nextDoc.status === undefined) nextDoc.status = 'active';
      if (nextDoc.sortOrder === undefined) nextDoc.sortOrder = 0;
      if (nextDoc.icon === undefined) nextDoc.icon = '';
      if (nextDoc.coverImage === undefined) nextDoc.coverImage = '';
    } else if (collectionName === 'rooms') {
      if (nextDoc.sortOrder === undefined) nextDoc.sortOrder = 0;
      if (nextDoc.icon === undefined) nextDoc.icon = '';
      if (nextDoc.coverImage === undefined) nextDoc.coverImage = '';
    } else if (collectionName === 'tags') {
      if (nextDoc.sortOrder === undefined) nextDoc.sortOrder = 0;
      if (nextDoc.coverImage === undefined) nextDoc.coverImage = '';
    }

    const res = await db.collection(collectionName).add({ data: nextDoc });

    return { code: 0, data: { _id: res._id, ...nextDoc } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

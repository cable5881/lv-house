const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const pick = (obj, keys) => {
  const out = {};
  keys.forEach(k => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  });
  return out;
};

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (!users.length || users[0].role !== 'admin') {
      return { code: 403, message: '无权限' };
    }

    const { collectionName, id, updates } = event || {};
    const allowed = ['collections', 'scenes', 'rooms', 'tags'];
    if (!allowed.includes(collectionName)) {
      return { code: 400, message: '不允许的集合' };
    }
    if (!id) {
      return { code: 400, message: '缺少id' };
    }

    const fieldsByCollection = {
      collections: ['title', 'periodLabel', 'coverImage', 'status', 'sortOrder', 'publishDate'],
      scenes: ['name', 'icon', 'coverImage', 'status', 'sortOrder'],
      rooms: ['name', 'icon', 'coverImage', 'sortOrder'],
      tags: ['name', 'coverImage', 'sortOrder']
    };

    const patch = pick(updates, fieldsByCollection[collectionName]);
    if (!Object.keys(patch).length) {
      return { code: 400, message: '没有可更新字段' };
    }
    patch.updatedAt = db.serverDate();

    await db.collection(collectionName).doc(id).update({ data: patch });

    const { data: newDoc } = await db.collection(collectionName).doc(id).get();
    return { code: 0, data: newDoc };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

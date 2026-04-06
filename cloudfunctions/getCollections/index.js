const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const { id, limit = 20 } = event;
    let query = db.collection('collections').where({ status: 'published' });
    if (id) query = db.collection('collections').where({ _id: id });
    const { data } = await query.orderBy('sortOrder', 'desc').orderBy('publishDate', 'desc').limit(limit).get();
    return { code: 0, data };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

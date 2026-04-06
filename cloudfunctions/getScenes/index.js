const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const { data } = await db.collection('scenes').where({ status: 'active' }).orderBy('sortOrder', 'desc').get();
    return { code: 0, data };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

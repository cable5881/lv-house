const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  try {
    const updateData = { updatedAt: db.serverDate() };
    if (event.nickName !== undefined) updateData.nickName = event.nickName;
    if (event.avatarUrl !== undefined) updateData.avatarUrl = event.avatarUrl;
    if (event.birthday !== undefined) updateData.birthday = event.birthday;
    if (event.gender !== undefined) updateData.gender = event.gender;

    await db.collection('users').where({ _openid: wxContext.OPENID }).update({ data: updateData });
    return { code: 0, data: {} };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询用户是否已存在
    const { data } = await db.collection('users').where({ _openid: openid }).get();

    if (data.length > 0) {
      return { code: 0, data: { openid, userInfo: data[0] } };
    }

    // 新用户，创建记录
    const newUser = {
      _openid: openid,
      nickName: '',
      avatarUrl: '',
      birthday: '',
      gender: 0,
      role: 'user',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    const res = await db.collection('users').add({ data: newUser });
    newUser._id = res._id;
    return { code: 0, data: { openid, userInfo: newUser } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

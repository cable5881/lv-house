const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { goodsId } = event || {};

  if (!goodsId) {
    return { code: 400, message: '缺少商品ID' };
  }

  try {
    const { data: goods } = await db.collection('goods').doc(goodsId).get();
    if (!goods || !goods._id) {
      return { code: 404, message: '商品不存在' };
    }
    if (goods.status !== 'published') {
      return { code: 404, message: '商品不可分享' };
    }

    if (goods.posterCodeFileId) {
      return { code: 0, data: { fileID: goods.posterCodeFileId } };
    }

    const codeRes = await cloud.openapi.wxacode.getUnlimited({
      scene: goodsId,
      page: 'pages/goods/detail/detail',
      checkPath: false,
      envVersion: 'release'
    });

    const uploadRes = await cloud.uploadFile({
      cloudPath: `posters/codes/${goodsId}.png`,
      fileContent: codeRes.buffer
    });

    await db.collection('goods').doc(goodsId).update({
      data: {
        posterCodeFileId: uploadRes.fileID,
        updatedAt: db.serverDate()
      }
    });

    return {
      code: 0,
      data: {
        fileID: uploadRes.fileID
      }
    };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};


const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const isMissingFavoritesCollection = (err) => /database collection not exists|Db or Table not exist:\s*favorites/i.test(String((err && err.message) || err || ''));

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { goodsId } = event;

  if (!goodsId) {
    return { code: 400, message: '缺少商品ID' };
  }

  try {
    const [{ data: users }, goodsRes, favoriteRes] = await Promise.all([
      db.collection('users').where({ _openid: openid }).limit(1).get(),
      db.collection('goods').doc(goodsId).get(),
      db.collection('favorites').where({ userOpenid: openid, goodsId }).limit(1).get()
    ]);

    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    const goods = goodsRes.data;
    if (!goods || goods.status !== 'published') {
      return { code: 404, message: '商品不存在或不可收藏' };
    }

    const favorite = favoriteRes.data[0];

    if (favorite) {
      await Promise.all([
        db.collection('favorites').doc(favorite._id).remove(),
        db.collection('goods').doc(goodsId).update({
          data: {
            likeCount: Math.max(0, Number(goods.likeCount) - 1 || 0),
            updatedAt: db.serverDate()
          }
        })
      ]);

      return {
        code: 0,
        data: {
          favorited: false,
          likeCount: Math.max(0, Number(goods.likeCount) - 1 || 0)
        }
      };
    }

    const likeCount = Number(goods.likeCount) + 1 || 1;

    await Promise.all([
      db.collection('favorites').add({
        data: {
          userOpenid: openid,
          goodsId,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      }),
      db.collection('goods').doc(goodsId).update({
        data: {
          likeCount,
          updatedAt: db.serverDate()
        }
      })
    ]);

    return {
      code: 0,
      data: {
        favorited: true,
        likeCount
      }
    };
  } catch (err) {
    if (isMissingFavoritesCollection(err)) {
      return { code: 412, message: '收藏功能未初始化，请先在云开发数据库创建 favorites 集合后重试' };
    }
    return { code: -1, message: err.message };
  }
};

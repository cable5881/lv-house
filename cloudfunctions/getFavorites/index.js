const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const isMissingFavoritesCollection = (err) => /database collection not exists|Db or Table not exist:\s*favorites/i.test(String((err && err.message) || err || ''));

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 10 } = event;

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (!users.length) {
      return { code: 401, message: '请先登录' };
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 10));
    const skip = (safePage - 1) * safePageSize;

    let favorites = [];
    try {
      const result = await db.collection('favorites')
        .where({ userOpenid: openid })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(safePageSize)
        .get();
      favorites = result.data || [];
    } catch (err) {
      if (!isMissingFavoritesCollection(err)) throw err;
    }

    if (!favorites.length) {
      return { code: 0, data: { list: [], page: safePage, pageSize: safePageSize } };
    }

    const goodsIds = favorites.map(item => item.goodsId).filter(Boolean);
    const { data: goodsList } = await db.collection('goods')
      .where({
        _id: _.in(goodsIds),
        status: 'published'
      })
      .get();

    const goodsMap = {};
    goodsList.forEach(item => {
      goodsMap[item._id] = item;
    });

    const list = favorites
      .map(item => {
        const goods = goodsMap[item.goodsId];
        if (!goods) return null;
        return {
          ...goods,
          favoriteId: item._id,
          favoritedAt: item.createdAt,
          isFavorited: true
        };
      })
      .filter(Boolean);

    return { code: 0, data: { list, page: safePage, pageSize: safePageSize } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const isMissingFavoritesCollection = (err) => /database collection not exists|Db or Table not exist:\s*favorites/i.test(String((err && err.message) || err || ''));

exports.main = async (event) => {
  try {
    const { id } = event;
    const wxContext = cloud.getWXContext();

    // 浏览量 +1
    await db.collection('goods').doc(id).update({ data: { viewCount: _.inc(1) } });

    const { data } = await db.collection('goods').doc(id).get();

    // 查询关联维度名称
    const [collections, scenes, rooms, tags, favorites] = await Promise.all([
      data.collectionIds && data.collectionIds.length
        ? db.collection('collections').where({ _id: _.in(data.collectionIds) }).get().then(r => r.data) : [],
      data.sceneIds && data.sceneIds.length
        ? db.collection('scenes').where({ _id: _.in(data.sceneIds) }).get().then(r => r.data) : [],
      data.roomIds && data.roomIds.length
        ? db.collection('rooms').where({ _id: _.in(data.roomIds) }).get().then(r => r.data) : [],
      data.tagIds && data.tagIds.length
        ? db.collection('tags').where({ _id: _.in(data.tagIds) }).get().then(r => r.data) : [],
      wxContext.OPENID
        ? db.collection('favorites')
          .where({ userOpenid: wxContext.OPENID, goodsId: id })
          .limit(1)
          .get()
          .then(r => r.data)
          .catch(err => {
            if (isMissingFavoritesCollection(err)) return [];
            throw err;
          }) : []
    ]);

    data.collectionNames = (collections || []).map(c => c.periodLabel || c.title);
    data.sceneNames = (scenes || []).map(s => s.name);
    data.roomNames = (rooms || []).map(r => r.name);
    data.tagNames = (tags || []).map(t => t.name);
    data.isFavorited = !!(favorites && favorites.length);

    return { code: 0, data };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

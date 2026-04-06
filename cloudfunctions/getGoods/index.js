const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  try {
    const { collectionId, sceneId, roomId, tagId, priceMin, priceMax, minRating,
            sortBy = 'latest', keyword, page = 1, pageSize = 10 } = event;

    let query = { status: 'published' };

    if (collectionId) query.collectionIds = _.elemMatch(_.eq(collectionId));
    if (sceneId) query.sceneIds = _.elemMatch(_.eq(sceneId));
    if (roomId) query.roomIds = _.elemMatch(_.eq(roomId));
    if (tagId) query.tagIds = _.elemMatch(_.eq(tagId));
    if (priceMin !== undefined) query.price = _.gte(Number(priceMin));
    if (priceMax !== undefined) query.price = { ...query.price, ..._.lte(Number(priceMax)) };
    if (minRating) query.rating = _.gte(Number(minRating));
    if (keyword) query.name = db.RegExp({ regexp: keyword, options: 'i' });

    let sortField = 'createdAt';
    let sortOrder = 'desc';
    if (sortBy === 'hot') sortField = 'viewCount';
    else if (sortBy === 'rating') sortField = 'rating';
    else if (sortBy === 'price_asc') { sortField = 'price'; sortOrder = 'asc'; }
    else if (sortBy === 'price_desc') sortField = 'price';

    const skip = (page - 1) * pageSize;
    const { data } = await db.collection('goods')
      .where(query)
      .orderBy(sortField, sortOrder)
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: data, page, pageSize } };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};

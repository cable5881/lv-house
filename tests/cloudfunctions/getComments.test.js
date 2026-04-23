const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/getComments', () => {
  test('returns grouped comments with replies', async () => {
    const commentsCollection = {
      where: jest.fn()
    };

    const rootQuery = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [
          {
            _id: 'root-1',
            goodsId: 'goods-1',
            parentId: '',
            rootId: '',
            content: '一级评论',
            status: 'normal'
          }
        ]
      })
    };
    const replyQuery = {
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [
          {
            _id: 'reply-1',
            goodsId: 'goods-1',
            parentId: 'root-1',
            rootId: 'root-1',
            content: '回复内容',
            status: 'normal'
          }
        ]
      })
    };

    commentsCollection.where
      .mockImplementationOnce(() => rootQuery)
      .mockImplementationOnce(() => replyQuery);

    const { main } = loadCloudFunction('../../cloudfunctions/getComments/index', {
      collections: { comments: commentsCollection }
    });

    const result = await main({ goodsId: 'goods-1', page: 1, pageSize: 10 });

    expect(result).toEqual({
      code: 0,
      data: {
        list: [
          expect.objectContaining({
            _id: 'root-1',
            replies: [
              expect.objectContaining({
                _id: 'reply-1',
                content: '回复内容'
              })
            ]
          })
        ],
        page: 1,
        pageSize: 10,
        hasMore: false
      }
    });
  });
});


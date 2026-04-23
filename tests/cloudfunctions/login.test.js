const { loadCloudFunction } = require('../helpers/loadCloudFunction');

describe('cloudfunctions/login', () => {
  test('returns existing user without creating a new record', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        data: [{ _id: 'user-1', _openid: 'openid-1', role: 'user' }]
      }),
      add: jest.fn()
    };

    const { main } = loadCloudFunction('../../cloudfunctions/login/index', {
      openid: 'openid-1',
      collections: {
        users: usersCollection
      }
    });

    const result = await main({}, {});

    expect(usersCollection.add).not.toHaveBeenCalled();
    expect(result).toEqual({
      code: 0,
      data: {
        openid: 'openid-1',
        userInfo: { _id: 'user-1', _openid: 'openid-1', role: 'user' }
      }
    });
  });

  test('creates a new user when first logging in', async () => {
    const usersCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ data: [] }),
      add: jest.fn().mockResolvedValue({ _id: 'user-2' })
    };

    const { main } = loadCloudFunction('../../cloudfunctions/login/index', {
      openid: 'openid-2',
      collections: {
        users: usersCollection
      }
    });

    const result = await main({}, {});

    expect(usersCollection.add).toHaveBeenCalledWith({
      data: expect.objectContaining({
        _openid: 'openid-2',
        nickName: '',
        avatarUrl: '',
        birthday: '',
        gender: 0,
        role: 'user',
        createdAt: 'SERVER_DATE',
        updatedAt: 'SERVER_DATE'
      })
    });
    expect(result.code).toBe(0);
    expect(result.data.userInfo._id).toBe('user-2');
  });
});

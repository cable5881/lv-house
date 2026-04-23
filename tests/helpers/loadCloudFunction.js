const createCommandMock = () => ({
  eq: jest.fn(value => ({ $eq: value })),
  elemMatch: jest.fn(value => ({ $elemMatch: value })),
  gte: jest.fn(value => ({ $gte: value })),
  lte: jest.fn(value => ({ $lte: value })),
  in: jest.fn(value => ({ $in: value })),
  inc: jest.fn(value => ({ $inc: value }))
});

const loadCloudFunction = (modulePath, options = {}) => {
  const {
    openid = 'test-openid',
    collections = {},
    serverDate = 'SERVER_DATE',
    command = createCommandMock()
  } = options;

  jest.resetModules();

  const resolvedCollections = {};
  const db = {
    collection: jest.fn(name => {
      if (!resolvedCollections[name]) {
        resolvedCollections[name] = collections[name];
      }
      if (!resolvedCollections[name]) {
        throw new Error(`Missing mock collection: ${name}`);
      }
      return resolvedCollections[name];
    }),
    command,
    serverDate: jest.fn(() => serverDate),
    RegExp: jest.fn(input => ({ $regex: input }))
  };

  const cloud = {
    init: jest.fn(),
    database: jest.fn(() => db),
    getWXContext: jest.fn(() => ({ OPENID: openid }))
  };

  jest.doMock('wx-server-sdk', () => cloud, { virtual: true });

  return {
    main: require(modulePath).main,
    db,
    cloud,
    command
  };
};

module.exports = {
  loadCloudFunction,
  createCommandMock
};

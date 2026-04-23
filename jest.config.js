module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: [
    'miniprogram/utils/**/*.js',
    'cloudfunctions/*/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  clearMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 70,
      lines: 80
    }
  }
};

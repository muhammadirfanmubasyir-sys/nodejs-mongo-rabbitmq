module.exports = {
  testMatch: ['**/__tests__/**/*.test.js'],
  testEnvironment: 'node',
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/__tests__/**', '!src/server.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

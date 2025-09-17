const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/tests/integration'],
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.integration.json'
    }]
  }
};

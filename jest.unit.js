const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};

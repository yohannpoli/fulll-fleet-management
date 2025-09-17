module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  testTimeout: 30000,
  maxWorkers: '50%'
};

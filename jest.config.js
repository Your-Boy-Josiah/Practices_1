module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'Controllers/**/*.js',
    'Middleware/**/*.js',
    'Routes/**/*.js',
    'app.js',
    '!**/node_modules/**',
  ],
};

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-secret';
process.env.REFRESH_JWT_SECRET = 'test-refresh-secret';

afterEach(() => {
  jest.restoreAllMocks();
});

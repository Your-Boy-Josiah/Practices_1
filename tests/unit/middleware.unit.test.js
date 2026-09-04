const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../Middleware/Auth');
const { authorizeRoles } = require('../../Middleware/Role');

describe('Auth middleware', () => {
  test('verifyToken sets req.user for valid token', () => {
    const token = jwt.sign({ id: '1', role: 'Admin' }, process.env.JWT_SECRET);
    const authPrefix = ['Bearer', ' '].join('');

    const req = { headers: { authorization: authPrefix + token } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(req.user).toMatchObject({ id: '1', role: 'Admin' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('verifyToken rejects missing token', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Role middleware', () => {
  test('authorizeRoles allows matching role', () => {
    const req = { user: { role: 'Admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authorizeRoles('Admin', 'Super_Admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('authorizeRoles blocks disallowed role', () => {
    const req = { user: { role: 'User' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authorizeRoles('Admin', 'Super_Admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

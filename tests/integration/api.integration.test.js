const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../Controllers/User_Controller', () => ({
  CreateUser: (_req, res) => res.status(201).json({ success: true, message: 'User created' }),
  LoginUser: (_req, res) =>
    res.status(200).json({ success: true, token: 'access-token', refreshToken: 'refresh-token' }),
  RefreshToken: (_req, res) => res.status(200).json({ success: true, token: 'new-access-token' }),
}));

jest.mock('../../Controllers/Product_Controller', () => ({
  CreateProduct: (_req, res) => res.status(201).json({ success: true, product: { _id: '1' } }),
  GetProducts: (_req, res) => res.status(200).json({ success: true, data: [] }),
  GetProductByBarcode: (_req, res) => res.status(200).json({ success: true, product: { barcode: '123' } }),
  UpdateProduct: (_req, res) => res.status(200).json({ success: true, product: { _id: '1' } }),
  DeleteProduct: (_req, res) => res.status(200).json({ success: true }),
}));

jest.mock('../../Controllers/Sale_Controller', () => ({
  ProcessCheckout: (_req, res) => res.status(201).json({ success: true }),
  GetSalesHistory: (_req, res) => res.status(200).json({ success: true, data: [] }),
}));

jest.mock('../../Controllers/Restock_Controller', () => ({
  ProcessRestock: (_req, res) => res.status(201).json({ success: true }),
  GetRestockHistory: (_req, res) => res.status(200).json({ success: true, data: [] }),
}));

jest.mock('../../Controllers/Report_Controller', () => ({
  GetDailyRevenue: (_req, res) => res.status(200).json({ success: true }),
  GetLowStockProducts: (_req, res) => res.status(200).json({ success: true, data: [] }),
  GetExpiringProducts: (_req, res) => res.status(200).json({ success: true, data: [] }),
}));

const createApp = require('../../app');

const app = createApp();

const authHeader = (role = 'Admin') => {
  const token = jwt.sign(
    {
      id: '507f1f77bcf86cd799439011',
      role,
      email: 'staff@example.com',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { authorization: ['Bearer', ' '].join('') + token };
};

describe('API integration with middleware stack', () => {
  test('GET /health returns service status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('requestId');
  });

  test('User routes support success and validation failure', async () => {
    const validCreate = await request(app).post('/api/users/CreateUser').send({
      name: 'Test Cashier',
      email: 'cashier@example.com',
      password: 'Pass1234',
      gender: 'Male',
      phone_number: '08012345678',
      age: 23,
    });
    expect(validCreate.status).toBe(201);

    const invalidCreate = await request(app).post('/api/users/CreateUser').send({
      name: 'No Email User',
      password: 'Pass1234',
      gender: 'Male',
      phone_number: '08099999999',
      age: 23,
    });
    expect(invalidCreate.status).toBe(400);

    const login = await request(app).post('/api/users/LoginUser').send({
      email: 'cashier@example.com',
      password: 'Pass1234',
    });
    expect(login.status).toBe(200);

    const refresh = await request(app).post('/api/users/RefreshToken').send({
      refreshToken: 'valid-refresh-token',
    });
    expect(refresh.status).toBe(200);
  });

  test('Product routes enforce auth/role/validation', async () => {
    const noToken = await request(app).get('/api/products');
    expect(noToken.status).toBe(401);

    const keeper = authHeader('Store_Keeper');
    const list = await request(app).get('/api/products').set(keeper);
    expect(list.status).toBe(200);

    const create = await request(app)
      .post('/api/products/CreateProduct')
      .set(keeper)
      .send({
        name: 'Yoghurt',
        barcode: '1234567890123',
        category: 'Dairy',
        costPrice: 500,
        sellingPrice: 650,
        quantity: 40,
        supplierId: '507f1f77bcf86cd799439011',
      });
    expect(create.status).toBe(201);

    const badId = await request(app)
      .put('/api/products/not-an-id')
      .set(keeper)
      .send({ quantity: 20 });
    expect(badId.status).toBe(400);

    const admin = authHeader('Admin');
    const remove = await request(app).delete('/api/products/507f1f77bcf86cd799439011').set(admin);
    expect(remove.status).toBe(200);
  });

  test('Sales routes enforce auth, validation, and admin history role', async () => {
    const cashier = authHeader('User');

    const invalidCheckout = await request(app)
      .post('/api/sales/checkout')
      .set(cashier)
      .send({ items: [], paymentMethod: 'Cash' });
    expect(invalidCheckout.status).toBe(400);

    const validCheckout = await request(app)
      .post('/api/sales/checkout')
      .set(cashier)
      .send({
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
        paymentMethod: 'Cash',
      });
    expect(validCheckout.status).toBe(201);

    const deniedHistory = await request(app).get('/api/sales').set(cashier);
    expect(deniedHistory.status).toBe(403);

    const admin = authHeader('Admin');
    const history = await request(app).get('/api/sales').set(admin);
    expect(history.status).toBe(200);
  });

  test('Restock routes enforce validation and management-only history', async () => {
    const keeper = authHeader('Store_Keeper');

    const invalidRestock = await request(app)
      .post('/api/restock')
      .set(keeper)
      .send({
        productId: '507f1f77bcf86cd799439011',
        supplierId: '507f1f77bcf86cd799439011',
        quantityAdded: 0,
        unitCost: 900,
      });
    expect(invalidRestock.status).toBe(400);

    const validRestock = await request(app)
      .post('/api/restock')
      .set(keeper)
      .send({
        productId: '507f1f77bcf86cd799439011',
        supplierId: '507f1f77bcf86cd799439011',
        quantityAdded: 7,
        unitCost: 900,
      });
    expect(validRestock.status).toBe(201);

    const deniedHistory = await request(app).get('/api/restock').set(keeper);
    expect(deniedHistory.status).toBe(403);

    const admin = authHeader('Admin');
    const history = await request(app).get('/api/restock').set(admin);
    expect(history.status).toBe(200);
  });

  test('Report routes enforce role permissions', async () => {
    const cashier = authHeader('User');
    const deniedRevenue = await request(app).get('/api/reports/daily-revenue').set(cashier);
    expect(deniedRevenue.status).toBe(403);

    const admin = authHeader('Admin');

    const revenue = await request(app).get('/api/reports/daily-revenue').set(admin);
    const lowStock = await request(app).get('/api/reports/low-stock').set(admin);
    const expiring = await request(app).get('/api/reports/expiring-soon').set(admin);

    expect(revenue.status).toBe(200);
    expect(lowStock.status).toBe(200);
    expect(expiring.status).toBe(200);
  });
});

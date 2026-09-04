jest.mock('mongoose', () => ({
  startSession: jest.fn(),
  Types: { ObjectId: { isValid: jest.fn(() => true) } },
}));

jest.mock('../../Models/Products', () => ({
  findById: jest.fn(),
}));

jest.mock('../../Models/Sale', () =>
  jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }))
);

jest.mock('../../Models/Restock', () =>
  jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }))
);

jest.mock('../../Models/Supplier', () => ({
  findById: jest.fn(),
}));

const PM = require('mongoose');
const Product = require('../../Models/Products');
const Supplier = require('../../Models/Supplier');

const SaleController = require('../../Controllers/Sale_Controller');
const RestockController = require('../../Controllers/Restock_Controller');

describe('Transaction controller safeguards', () => {
  const session = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(() => {
    PM.startSession.mockResolvedValue(session);
    session.startTransaction.mockClear();
    session.commitTransaction.mockClear();
    session.abortTransaction.mockClear();
    session.endSession.mockClear();
  });

  test('Sale checkout aborts transaction when stock is insufficient', async () => {
    const productDoc = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Milk',
      isActive: true,
      quantity: 1,
      sellingPrice: 1000,
      save: jest.fn(),
    };

    Product.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue(productDoc),
    });

    const req = {
      body: {
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
        paymentMethod: 'Cash',
      },
      user: { id: '507f1f77bcf86cd799439012' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await SaleController.ProcessCheckout(req, res);

    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(productDoc.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Restock aborts transaction when supplier is inactive', async () => {
    Supplier.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue({ isActive: false }),
    });

    Product.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue({ isActive: true, save: jest.fn(), quantity: 2 }),
    });

    const req = {
      body: {
        productId: '507f1f77bcf86cd799439011',
        supplierId: '507f1f77bcf86cd799439013',
        quantityAdded: 2,
        unitCost: 300,
      },
      user: { id: '507f1f77bcf86cd799439099' },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await RestockController.ProcessRestock(req, res);

    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

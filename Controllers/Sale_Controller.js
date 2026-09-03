// ===============================================================
//  Sales_Controller.js
//  Handles the Point of Sale (POS) checkout process.
//  Uses MongoDB Transactions (ACID properties) to ensure that 
//  stock deductions and receipt generation happen simultaneously.
// ===============================================================

const Sales = require('../Models/Sale');
const Product = require('../Models/Products');
const PM = require('mongoose');

// ==============================================================
// PROCESS CHECKOUT (POS TRANSACTION)
// Route  : POST /api/sales/checkout
// Access : User (Cashier), Store_Keeper, Admin, Super_Admin
// ==============================================================

exports.ProcessCheckout = async (req, res) => {
  // Start a MongoDB session to enable the "all-or-nothing" transaction
  const session = await PM.startSession();
  session.startTransaction();

  try {
    // Destructure the cart items and payment method from the request body
    // items format: [{ productId: "...", quantity: 2 }, { productId: "...", quantity: 1 }]
    const { items, paymentMethod } = req.body;

    // Validate the incoming payload
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Shopping cart cannot be empty' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Please select a payment method' });
    }

    let totalAmount = 0;
    const processedItems = [];

    // Loop through every item in the shopping cart
    for (const cartItem of items) {
      
      // Fetch the product from the DB. 
      // We pass the session to lock this document during the transaction.
      const product = await Product.findById(cartItem.productId).session(session);

      // Check 1: Does the product exist and is it active?
      if (!product || !product.isActive) {
        throw new Error(`Product with ID ${cartItem.productId} is invalid or inactive`);
      }

      // Check 2: Do we have enough stock on the shelf to sell this?
      if (product.quantity < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.quantity} left.`);
      }

      // Calculate the financials for this specific item
      const priceAtTimeOfSale = product.sellingPrice;
      const subTotal = priceAtTimeOfSale * cartItem.quantity;

      // Add to the running total for the whole receipt
      totalAmount += subTotal;

      // Add the processed data to our receipt array
      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        priceAtTimeOfSale,
        subTotal,
      });

      // DEDUCT THE STOCK
      // We subtract the bought quantity from the store's inventory
      product.quantity -= cartItem.quantity;
      await product.save({ session }); // Save it under the current transaction
    }

    // Generate a unique Receipt Number (e.g., REC-20260903-123456)
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6 random digits
    const receiptNumber = `REC-${datePrefix}-${randomSuffix}`;

    // Create the final Sales Document (The Digital Receipt)
    // We get req.user.id from the auth.js middleware!
    const newSale = new Sales({
      receiptNumber,
      cashierId: req.user.id, 
      items: processedItems,
      totalAmount,
      paymentMethod,
    });

    // Save the receipt under the current transaction
    const savedSale = await newSale.save({ session });

    // IF WE REACH THIS POINT, EVERYTHING WORKED PERFECTLY.
    // Commit the transaction to officially save the receipt and the new stock levels to the DB.
    await session.commitTransaction();
    session.endSession();

    // Return the digital receipt to the POS frontend to be printed
    return res.status(201).json({
      message: 'Checkout successful',
      receipt: savedSale,
    });

  } catch (error) {
    // ABORT TRANSACTION
    // If ANY error occurs (e.g., out of stock, network drop), we cancel everything.
    // Stock numbers revert back to normal, and no receipt is created.
    await session.abortTransaction();
    session.endSession();

    console.error('Checkout Transaction Error:', error);
    
    // Check if it's our custom thrown error (like out of stock) or a server crash
    if (error.message.includes('Insufficient stock') || error.message.includes('invalid or inactive')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Checkout failed due to a server error', error: error.message });
  }
};

// ==============================================================
// GET SALES HISTORY
// Route  : GET /api/sales
// Access : Admin, Super_Admin (Restricted via role.js)
// ==============================================================

exports.GetSalesHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch sales and instantly attach the Cashier's Name using .populate()
    const [sales, totalSales] = await Promise.all([
      Sales.find()
        .populate('cashierId', 'name email') // Grabs the name and email from the Users collection
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Sales.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        totalSales,
        totalPages: Math.ceil(totalSales / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error fetching sales history:', error);
    return res.status(500).json({ message: 'Error fetching sales history', error: error.message });
  }
};

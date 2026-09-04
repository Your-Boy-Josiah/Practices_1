// ===============================================================
//  Restock_Controller
//  Handles the processing of incoming deliveries.
//  Uses MongoDB Transactions to securely log the delivery and 
//  increases the store's inventory quantity simultaneously. (if needed)
// ======================================================================

const Restock = require('../Models/Restock');
const Product = require('../Models/Products');
const Supplier = require('../Models/Supplier');
const PM = require('mongoose');

// ==============================================================
// PROCESS INCOMING DELIVERY (RESTOCK)
// Route  : POST /api/restock
// Access : Store_Keepers, Admins, Super_Admin
// ==============================================================

exports.ProcessRestock = async (req, res) => {
  // Start a MongoDB session to enable the transaction bubble
  const session = await PM.startSession();
  session.startTransaction();

  try {
    // Destructure delivery details from the request body
    const { 
      productId, 
      supplierId, 
      quantityAdded, 
      unitCost, 
      batchNumber, 
      expiryDate, 
      notes 
    } = req.body;

    // Validate mandatory fields
    if (!productId || !supplierId || !quantityAdded || unitCost === undefined) {
      return res.status(400).json({ message: 'Please provide productId, supplierId, quantityAdded, and unitCost' });
    }

    // Verify the Supplier exists
    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier || !supplier.isActive) {
      throw new Error('Supplier not found or is currently inactive');
    }

    // Verify the Product exists
    const product = await Product.findById(productId).session(session);
    if (!product || !product.isActive) {
      throw new Error('Product not found or is currently inactive');
    }

    // Update the Product Inventory
    // We add the newly delivered boxes to the existing stock
    product.quantity += Number(quantityAdded);
    
    // Update the cost price if the supplier changed their prices
    product.costPrice = Number(unitCost); 
    
    // If the new batch has an expiry date, update the product's current expiry
    if (expiryDate) {
      product.expiryDate = new Date(expiryDate);
    }
    
    // Save the updated product data
    await product.save({ session });

    // Generate a unique Delivery Number (e.g., DEL-20260903-789012)
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); 
    const deliveryNumber = `DEL-${datePrefix}-${randomSuffix}`;

    // Create the Restock Ledger Entry
    // We get the staff member's ID from req.user authentication middleware
    const newRestock = new Restock({
      deliveryNumber,
      productId,
      supplierId,
      storeKeeperId: req.user.id, 
      quantityAdded: Number(quantityAdded),
      unitCost: Number(unitCost),
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      notes,
    });

    const savedRestock = await newRestock.save({ session });

    // Store the Transaction (if successful) and commit all changes to the database
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Restock processed successfully',
      restockRecord: savedRestock,
    });

  } catch (error) {
    // Abort and rollback all changes if anything fails
    await session.abortTransaction();
    session.endSession();
    console.error('Restock Transaction Error:', error);

    // Differentiate between our custom validation errors and server crashes
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Restock failed due to a server error', error: error.message });
  }
};

// ==============================================================
// GET RESTOCK HISTORY (THE LEDGER)
// Route  : GET /api/restock
// Access : Admins, Super_Admin
// ==============================================================

exports.GetRestockHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch the ledger and populate names so the Admin sees readable data, not just ObjectIDs
    const [history, totalRecords] = await Promise.all([
      Restock.find()
        .populate('productId', 'name barcode') 
        .populate('supplierId', 'companyName') 
        .populate('storeKeeperId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Restock.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: history,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error fetching restock history:', error);
    return res.status(500).json({ message: 'Error fetching restock history', error: error.message });
  }
};

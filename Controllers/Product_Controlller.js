// ============================================================
//  Product_Controller.js
//  Handles all CRUD operations for the Product resource.
//  Imported by Product_Routes.js and mounted under /api/products
// Mongoose model for the Product collection
// Mongoose core library — used here for ObjectId validation
// ============================================================

const Product = require('../Models/Products');
const mongoose = require('mongoose');

// ============================================================
// CREATE A NEW PRODUCT
// Route  : POST /api/products
// Access : Admin only (protected by verifyToken + requireAdmin)
// ============================================================

exports.CreateProduct = async (req, res) => {
  try {
    // Step 1: Destructure all expected fields from the request body 
    const {
      name,
      barcode,
      sku,
      category,
      costPrice,
      sellingPrice,
      quantity,
      unit,
      size,
      reorderLevel,
      isPerishable,
      expiryDate,
      description,
    } = req.body;

    // Step 2: Validate that all mandatory fields are present 
    // costPrice, sellingPrice, and quantity use strict undefined check
    // because 0 is a valid value and would fail a simple falsy check (!costPrice)

    if ( !name || !barcode || !category || costPrice === undefined || sellingPrice === undefined || quantity === undefined ) {
      return res.status(400).json({
        message:
          'Please provide all required fields: name, barcode, category, costPrice, sellingPrice, quantity',
      });
    }

    // Step 3: Check if a product with the same barcode already exists 
    // trim() removes accidental leading/trailing whitespace before comparison

    const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
    if (existingBarcode) {
      return res.status(409).json({ message: 'A product with this barcode already exists' });
    }

    // Step 4: Check SKU uniqueness only if a SKU was provided 
    // SKU is optional, but if given it must be unique across all products
    // Stored in uppercase for consistent comparison

    if (sku) {
      const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
      if (existingSku) {
        return res.status(409).json({ message: 'A product with this SKU already exists' });
      }
    }

    // Step 5: Build the new Product document 
    // Each field is sanitised and cast to its correct type before saving:
    //   - Strings  → trimmed to remove whitespace
    //   - Numbers  → cast with Number() to avoid storing string values
    //   - Booleans → cast with Boolean() so "false"/"0" are handled safely
    //   - Dates    → converted to JS Date objects
    //   - Optional fields fall back to safe defaults if not provided

    const product = new Product({
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku ? sku.trim().toUpperCase() : undefined,  // Omit field if not provided
      category,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      unit: unit || 'pcs',                              // Default unit is pieces
      size: size ? size.trim() : null,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10, // Default reorder threshold
      isPerishable: Boolean(isPerishable),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description ? description.trim() : '',
      isActive: true,                                   // New products are active by default
    });

    // Step 6: Persist the new product document to MongoDB 

    const savedProduct = await product.save();

    // Step 7: Return the saved product with a 201 Created status 
    return res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct,
    });

  } catch (error) {
    // Error Handler A: MongoDB duplicate key error (code 11000) 
    // Triggered if a unique index is violated at the DB level
    // (acts as a second safety net after the manual checks above)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // Extract which field caused the clash
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }

    // Error Handler B: Any other unexpected server error ---
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// ============================================================
// GET ALL PRODUCTS  (Search + Filter + Pagination)
// Route  : GET /api/products?page=1&limit=20&search=milk&category=dairy&lowStock=true
// Access : Public
// ============================================================

exports.GetProducts = async (req, res) => {
  try {
    // Step 1: Parse and sanitise pagination parameters from the query string 
    // Math.max ensures page is never less than 1
    // Math.min caps limit at 100 to prevent excessively large DB reads

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    // Calculate how many documents to skip to reach the requested page

    const skip = (page - 1) * limit;

    // Step 2: Extract optional filter parameters from the query string 

    const { search, category, lowStock } = req.query;

    // Step 3: Build the MongoDB query object 
    // Start by only returning active (non-archived) products
    // ALL filters must be added to this object BEFORE any DB call is made

    const query = { isActive: true };

    // Step 4: Add full-text style search filter if a search term was provided
    // $or checks name, barcode, and SKU fields using a case-insensitive regex

    if (search) {
      query.$or = [
        { name:    { $regex: search.trim(), $options: 'i' } },
        { barcode: { $regex: search.trim(), $options: 'i' } },
        { sku:     { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Step 5: Add category filter if provided 

    if (category) {
      query.category = category;
    }

    // Step 6: Add low-stock filter if requested 
    // $expr allows comparison between two fields in the same document
    // Matches products where quantity <= reorderLevel

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    // Step 7: Execute both DB queries simultaneously using Promise.all 
    // Running them in parallel is faster than awaiting them one after the other.
    // .lean() returns plain JS objects instead of full Mongoose documents (faster reads)

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query), // Total count used to calculate pagination metadata
    ]);

    // Step 8: Return the products along with pagination metadata 
    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    // Error Handler: Unexpected server error while fetching 
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// ============================================================
// GET PRODUCT BY BARCODE (Fast POS Scanner Lookup)
// Route  : GET /api/products/barcode/:barcode
// Access : Public
// ============================================================

exports.GetProductByBarcode = async (req, res) => {
  try {
    // Step 1: Extract the barcode value from the URL parameter 
    const { barcode } = req.params;

    // Step 2: Query the DB for an active product matching this barcode 
    // isActive: true ensures archived products are not returned to the POS
    // trim() handles any accidental whitespace that may come from a scanner

    const product = await Product.findOne({ barcode: barcode.trim(), isActive: true });

    // Step 3: Return 404 if no matching active product is found 
    if (!product) {
      return res.status(404).json({ message: 'Product not found with this barcode' });
    }

    // Step 4: Return the matched product
    return res.status(200).json({ product });

  } catch (error) {
    // Error Handler: Unexpected server error during barcode lookup
    console.error('Error finding barcode:', error);
    return res.status(500).json({ message: 'Error scanning barcode', error: error.message });
  }
};

// ============================================================
// UPDATE A PRODUCT
// Route  : PUT /api/products/:id
// Access : Admin only (protected by verifyToken + requireAdmin)
// ============================================================

exports.UpdateProduct = async (req, res) => {
  try {
    // Step 1: Extract the product ID from the URL parameter 
    const { id } = req.params;

    // Step 2: Validate that the ID is a valid MongoDB ObjectId 
    // Without this check, an invalid ID (e.g. "abc") causes a Mongoose CastError
    // which would surface as an unhandled 500. We return a clean 400 instead.

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Step 3: Copy the request body to avoid mutating the original object
    // Then normalise any unique key fields before saving to keep DB data consistent
    const updateData = { ...req.body };

    // Normalise SKU to uppercase if it is being updated
    if (updateData.sku) updateData.sku = updateData.sku.trim().toUpperCase();

    // Trim whitespace from barcode if it is being updated
    if (updateData.barcode) updateData.barcode = updateData.barcode.trim();

    // Step 4: Find the product by ID and apply the update
    // new: true → returns the updated document instead of the old one
    // runValidators: true → enforces schema-level validation rules on the update

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Step 5: Return 404 if no product was found with the given ID 
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 6: Return the updated product document
    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });

  } catch (error) {
    // Error Handler A: MongoDB duplicate key error (code 11000)
    // Triggered if the new barcode or SKU value already belongs to another product
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }

    // Error Handler B: Any other unexpected server error
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivated data is kept)
// Route  : DELETE /api/products/:id
// Access : Admin only (protected by verifyToken + requireAdmin)
// ============================================================

exports.DeleteProduct = async (req, res) => {
  try {
    // Step 1: Extract the product ID from the URL parameter 
    const { id } = req.params;

    // Step 2: Validate that the ID is a valid MongoDB ObjectID 
    // Prevents a Mongoose CastError from becoming an unhandled 500 error

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Step 3: Set isActive to false instead of deleting the document
    // This is a soft delete the product record is preserved in the DB
    // for historical reference (e.g. past sales records, audit trails)
    // new: true → confirms the update was applied by returning the updated doc

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    //Step 4: Return 404 if no product was found with the given ID 
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 5: Confirm the product has been archived 
    return res.status(200).json({ message: 'Product archived/deactivated successfully' });

  } catch (error) {
    //Error Handler: Unexpected server error during soft delete 
    console.error('Error archiving product:', error);
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// ===============================================================
//  Product_Controller.js
//  Handles all CRUD operations for the Product resource.
//  Imported by Product_Routes.js and mounted under /api/products.
// ===============================================================

const Product = require('../Models/Products');
const PM = require('mongoose');

// ==============================================================
// CREATE A NEW PRODUCT
// Route  : POST /api/products/CreateProduct
// Access : Store_Keeper, Admin, Super_Admin
// ==============================================================

exports.CreateProduct = async (req, res) => {
  try {
    // 1. Destructure all expected fields from the request body
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
      supplierId,
    } = req.body;

    // 2. Validate mandatory fields
    // Form-data empty values can arrive as empty strings, so check for both undefined and ''
    if (
      !name ||
      !barcode ||
      !category ||
      costPrice === undefined || costPrice === '' ||
      sellingPrice === undefined || sellingPrice === '' ||
      quantity === undefined || quantity === ''
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, barcode, category, costPrice, sellingPrice, quantity',
      });
    }

    // 3. Check for barcode collision
    const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
    if (existingBarcode) {
      return res.status(409).json({ message: 'A product with this barcode already exists' });
    }

    // 4. Check for SKU collision if provided
    if (sku && sku.trim()) {
      const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
      if (existingSku) {
        return res.status(409).json({ message: 'A product with this SKU already exists' });
      }
    }

    // 5. Handle Product Image (Multer)
    const imagePath = req.file
      ? `uploads/${req.file.filename}`
      : 'uploads/default-product.png';

    // 6. Build the new Product document
    const product = new Product({
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku && sku.trim() ? sku.trim().toUpperCase() : undefined,
      category: category.trim(),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      unit: unit ? unit.trim() : 'pcs',
      size: size && size.trim() ? size.trim() : null,
      reorderLevel: reorderLevel !== undefined && reorderLevel !== '' ? Number(reorderLevel) : 10,
      isPerishable: String(isPerishable) === 'true',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description ? description.trim() : '',
      supplierId: supplierId && supplierId.trim() ? supplierId.trim() : undefined,
      image: imagePath,
      isActive: true,
    });

    // 7. Persist to MongoDB
    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct,
    });

  } catch (error) {
    // Duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue)[0];
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }

    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// ============================================================
// GET ALL PRODUCTS  (Search + Filter + Pagination)
// Route  : GET /api/products?page=1&limit=20&search=milk&category=dairy&lowStock=true
// Access : Authenticated Staff
// ============================================================

exports.GetProducts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    const { search, category, lowStock } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name:    { $regex: search.trim(), $options: 'i' } },
        { barcode: { $regex: search.trim(), $options: 'i' } },
        { sku:     { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category.trim();
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

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
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// ============================================================
// GET PRODUCT BY BARCODE (Fast POS Scanner Lookup)
// Route  : GET /api/products/barcode/:barcode
// Access : Authenticated Staff
// ============================================================

exports.GetProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({ barcode: barcode.trim(), isActive: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found with this barcode' });
    }

    return res.status(200).json({ success: true, product });

  } catch (error) {
    console.error('Error finding barcode:', error);
    return res.status(500).json({ message: 'Error scanning barcode', error: error.message });
  }
};

// ============================================================
// UPDATE A PRODUCT
// Route  : PUT /api/products/:id
// Access : Store_Keeper, Admin, Super_Admin
// ============================================================

exports.UpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!PM.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const updateData = { ...req.body };

    // Format fields if they are included in the request
    if (updateData.sku) updateData.sku = updateData.sku.trim().toUpperCase();
    if (updateData.barcode) updateData.barcode = updateData.barcode.trim();
    if (updateData.costPrice !== undefined && updateData.costPrice !== '') updateData.costPrice = Number(updateData.costPrice);
    if (updateData.sellingPrice !== undefined && updateData.sellingPrice !== '') updateData.sellingPrice = Number(updateData.sellingPrice);
    if (updateData.quantity !== undefined && updateData.quantity !== '') updateData.quantity = Number(updateData.quantity);
    if (updateData.reorderLevel !== undefined && updateData.reorderLevel !== '') updateData.reorderLevel = Number(updateData.reorderLevel);
    if (updateData.isPerishable !== undefined) updateData.isPerishable = String(updateData.isPerishable) === 'true';

    // If a new product image was uploaded during the update
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue)[0];
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }

    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivation)
// Route  : DELETE /api/products/:id
// Access : Admin, Super_Admin
// ============================================================

exports.DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!PM.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Product archived/deactivated successfully' 
    });

  } catch (error) {
    console.error('Error archiving product:', error);
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

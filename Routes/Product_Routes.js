// ============================================================
//  Product_Routes.js
//  Defines all HTTP routes for the Product resource.
//  Imported by app.js and mounted under /api/products
// ============================================================

const express = require('express');
const router = express.Router();
const ProductController = require('../Controllers/Product_Controller'); // Fixed the 3 L's typo!

// Import our Security Middlewares
const { verifyToken } = require('../Middleware/auth'); // Fixed from 'verify' to 'verifyToken'
const { authorizeRoles } = require('../Middleware/role'); // Added the Role Bouncer!

// ============================================================
// GET ALL PRODUCTS  (Pagination + Search + Filters)
// Access : Any logged-in staff
// ============================================================
router.get('/', verifyToken, ProductController.GetProducts);

// ============================================================
// GET PRODUCT BY BARCODE  (POS Scanner Lookup)
// Access : Any logged-in staff
// ============================================================
router.get('/barcode/:barcode', verifyToken, ProductController.GetProductByBarcode);

// ============================================================
// CREATE A NEW PRODUCT
// Access : Store_Keeper, Admin, Super_Admin
// ============================================================
router.post('/CreateProduct', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  ProductController.CreateProduct
);

// ============================================================
// UPDATE A PRODUCT
// Access : Store_Keeper, Admin, Super_Admin
// ============================================================
router.put('/:id', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  ProductController.UpdateProduct
);

// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivate)
// Access : Management Only (Admin, Super_Admin)
// ============================================================
router.delete('/:id', 
  verifyToken,  
  authorizeRoles('Admin', 'Super_Admin'), 
  ProductController.DeleteProduct
);

// Export the router to be mounted in app.js
module.exports = router;

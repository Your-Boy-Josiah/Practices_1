// const express = require('express');
// const router = express.Router(); //

// // Import the Product Controller
// const ProductController = require('../Controllers/Product_Controller');


// //Define the routes
// const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// // 1. Get all products (with pagination, search, lowStock filter)
// // Example: GET /api/products?page=1&limit=20&search=milk

// router.get('/', ProductController.GetProducts);

// // 2. Lookup single product by barcode (POS Scanning)
// // Example: GET /api/products/barcode/1234567890
// router.get('/barcode/:barcode', ProductController.GetProductByBarcode);

// // 3. Admin-only operations
// router.post('/', verifyToken, requireAdmin, ProductController.CreateProduct);
// router.put('/:id', verifyToken, requireAdmin, ProductController.UpdateProduct);
// router.delete('/:id', verifyToken, requireAdmin, ProductController.DeleteProduct);

// // Export the router to be used in other files
// module.exports = router;

// ============================================================
//  Product_Routes.js
//  Defines all HTTP routes for the Product resource.
//  Imported by server.js (or app.js) and mounted under /api/products
//
//  express          — Node.js web framework used to create the router
//  express.Router   — Isolates product routes into a modular mini-app
//  ProductController — Handles the business logic for each route
//  verifyToken       — Middleware that validates the JWT on the request
//  requireAdmin      — Middleware that restricts access to admin users only
// ============================================================

const express = require('express');
const router = express.Router();
const ProductController = require('../Controllers/Product_Controller');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


// ============================================================
// GET ALL PRODUCTS  (Pagination + Search + Filters)
// Route  : GET /api/products?page=1&limit=20&search=milk&category=dairy&lowStock=true
// Access : Public
// ============================================================

// Step 1: Return a paginated list of all active products
// Optional query params — search, category, and lowStock — are handled inside the controller
router.get('/', ProductController.GetProducts);


// ============================================================
// GET PRODUCT BY BARCODE  (POS Scanner Lookup)
// Route  : GET /api/products/barcode/:barcode
// Access : Public
// ============================================================

// Step 2: Look up a single active product by its barcode
// This route must be declared before /:id to prevent Express matching
// "barcode" as a dynamic :id parameter

router.get('/barcode/:barcode', ProductController.GetProductByBarcode);


// ============================================================
// CREATE A NEW PRODUCT
// Route  : POST /api/products
// Access : Admin only
// ============================================================

// Step 3: Create a new product — restricted to authenticated admins
// verifyToken validates the JWT, requireAdmin confirms the admin role

router.post('/', verifyToken, requireAdmin, ProductController.CreateProduct);


// ============================================================
// UPDATE A PRODUCT
// Route  : PUT /api/products/:id
// Access : Admin only
// ============================================================

// Step 4: Update an existing product by its MongoDB ObjectId
// verifyToken validates the JWT, requireAdmin confirms the admin role

router.put('/:id', verifyToken, requireAdmin, ProductController.UpdateProduct);


// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivate)
// Route  : DELETE /api/products/:id
// Access : Admin only
// ============================================================

// Step 5: Deactivate a product by its MongoDB ObjectId (data is preserved)
// verifyToken validates the JWT, requireAdmin confirms the admin role

router.delete('/:id', verifyToken, requireAdmin, ProductController.DeleteProduct);


// Step 6: Export the router to be mounted in server.js / app.js
module.exports = router;

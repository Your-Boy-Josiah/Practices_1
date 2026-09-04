const express = require('express');
const router = express.Router();

const ProductController = require('../Controllers/Product_Controller');
const { verifyToken } = require('../Middleware/Auth');
const { authorizeRoles } = require('../Middleware/Role');
const { upload, processImage } = require('../Middleware/Upload');
const { validateBody, validateQuery, validateParams } = require('../Middleware/Validation');
const {
  productsQuerySchema,
  barcodeParamSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
} = require('../Utililty/ValidationSchemas');

router.get('/', verifyToken, validateQuery(productsQuerySchema), ProductController.GetProducts);
router.get('/barcode/:barcode', verifyToken, validateParams(barcodeParamSchema), ProductController.GetProductByBarcode);

router.post(
  '/CreateProduct',
  verifyToken,
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'),
  upload.single('image'),
  processImage,
  validateBody(createProductSchema),
  ProductController.CreateProduct
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'),
  validateParams(productIdParamSchema),
  upload.single('image'),
  processImage,
  validateBody(updateProductSchema),
  ProductController.UpdateProduct
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'Super_Admin'),
  validateParams(productIdParamSchema),
  ProductController.DeleteProduct
);

module.exports = router;

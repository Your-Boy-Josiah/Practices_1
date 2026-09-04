const express = require('express');
const router = express.Router();
const SalesController = require('../Controllers/Sale_Controller');
const { verifyToken } = require('../Middleware/Auth');
const { authorizeRoles } = require('../Middleware/Role');
const { validateBody, validateQuery } = require('../Middleware/Validation');
const { checkoutSchema, paginationQuerySchema } = require('../Utililty/ValidationSchemas');

router.post('/checkout', verifyToken, validateBody(checkoutSchema), SalesController.ProcessCheckout);

router.get(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'Super_Admin'),
  validateQuery(paginationQuerySchema),
  SalesController.GetSalesHistory
);

module.exports = router;

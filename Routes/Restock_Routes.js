const express = require('express');
const router = express.Router();
const RestockController = require('../Controllers/Restock_Controller');
const { verifyToken } = require('../Middleware/Auth');
const { authorizeRoles } = require('../Middleware/Role');
const { validateBody, validateQuery } = require('../Middleware/Validation');
const { restockSchema, paginationQuerySchema } = require('../Utililty/ValidationSchemas');

router.post(
  '/',
  verifyToken,
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'),
  validateBody(restockSchema),
  RestockController.ProcessRestock
);

router.get(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'Super_Admin'),
  validateQuery(paginationQuerySchema),
  RestockController.GetRestockHistory
);

module.exports = router;

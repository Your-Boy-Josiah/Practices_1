// ===============================================================
//  Restock_Routes.js
//  Handles routing for inventory deliveries.
// ===============================================================

const express = require('express');
const router = express.Router();
const RestockController = require('../Controllers/Restock_Controller');
const { verifyToken } = require('../Middleware/auth');
const { authorizeRoles } = require('../Middleware/role');

// ============================================================
// PROCESS RESTOCK
// Only staff that manage inventory can log new truck deliveries
// ============================================================
router.post('/', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  RestockController.ProcessRestock
);

// ============================================================
// VIEW RESTOCK HISTORY
// Only management can view the historical delivery ledger
// ============================================================
router.get('/', 
  verifyToken, 
  authorizeRoles('Admin', 'Super_Admin'), 
  RestockController.GetRestockHistory
);

module.exports = router;

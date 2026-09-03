// ===============================================================
//  Report_Routes.js
//  Handles routing for the analytics and reporting dashboard.
// ===============================================================

const express = require('express');
const router = express.Router();
const ReportController = require('../Controllers/Report_Controller');
const { verifyToken } = require('../Middleware/auth');
const { authorizeRoles } = require('../Middleware/role');

// ============================================================
// DAILY REVENUE ROUTE
// Only Management (Admins) can see financial data
// ============================================================
router.get('/daily-revenue', 
  verifyToken, 
  authorizeRoles('Admin', 'Super_Admin'), 
  ReportController.GetDailyRevenue
);

// ============================================================
// INVENTORY ALERTS ROUTES
// Store Keepers and Management can see inventory alerts
// ============================================================
router.get('/low-stock', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  ReportController.GetLowStockProducts
);

router.get('/expiring-soon', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  ReportController.GetExpiringProducts
);

module.exports = router;

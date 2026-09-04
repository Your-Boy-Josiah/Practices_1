const express = require('express');
const router = express.Router();
const ReportController = require('../Controllers/Report_Controller');
const { verifyToken } = require('../Middleware/Auth');
const { authorizeRoles } = require('../Middleware/Role');

router.get('/daily-revenue', verifyToken, authorizeRoles('Admin', 'Super_Admin'), ReportController.GetDailyRevenue);
router.get('/low-stock', verifyToken, authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), ReportController.GetLowStockProducts);
router.get('/expiring-soon', verifyToken, authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), ReportController.GetExpiringProducts);

module.exports = router;

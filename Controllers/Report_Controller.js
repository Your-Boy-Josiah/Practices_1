// ===============================================================
//  Report_Controller
//  Handles the generation of analytics and business intelligence.
//  Provides Admins with real-time data on sales revenue, 
//  depleted inventory, and expiring perishable goods.
// ===============================================================

const Product = require('../Models/Products');
const Sales = require('../Models/Sale');

// ==============================================================
// GET TODAY'S REVENUE SUMMARY
// Route  : GET /api/reports/daily-revenue
// Access : Admins, Super_Admin
// ==============================================================

exports.GetDailyRevenue = async (req, res) => {
  try {
    // Calculate the start and end time of TODAY
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Use MongoDB Aggregation to calculate the total instantly
    // We tell the database: "Find all sales from today, and add up their totalAmount"
    const revenueStats = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 } // Counts how many receipts were printed
        }
      }
    ]);

    // Format the response
    const stats = revenueStats.length > 0 ? revenueStats[0] : { totalRevenue: 0, totalTransactions: 0 };

    return res.status(200).json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      data: {
        revenue: stats.totalRevenue,
        transactions: stats.totalTransactions
      }
    });

  } catch (error) {
    console.error('Error calculating daily revenue:', error);
    return res.status(500).json({ message: 'Error calculating revenue', error: error.message });
  }
};

// ==============================================================
// GET LOW STOCK ALERTS
// Route  : GET /api/reports/low-stock
// Access : Store_Keepers, Admins, Super_Admin
// ==============================================================

exports.GetLowStockProducts = async (req, res) => {
  try {
    // Query the database for active products where the current quantity is less than or equal to the designated reorderlevel.
    // We use $expr so MongoDB can compare two fields within the same document.
    const lowStockItems = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    })
    .select('name barcode quantity reorderLevel category') // Only pull what the dashboard needs
    .sort({ quantity: 1 }); // Sort ascending (items with 0 stock appear first)

    return res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

// ==============================================================
// GET EXPIRING PRODUCTS (One that will expire in the Next 7 Days)
// Route  : GET /api/reports/expiring-soon
// Access : Store_Keepers, Admins, Super_Admin
// ==============================================================

exports.GetExpiringProducts = async (req, res) => {
  try {
    // Define the timeframe: From Right Now until 7 Days from now
    const today = new Date();
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Query for perishable items whose expiryDate falls in this 7-day window
    const expiringItems = await Product.find({
      isActive: true,
      isPerishable: true,
      expiryDate: { $gte: today, $lte: nextWeek }
    })
    .select('name barcode quantity expiryDate')
    .sort({ expiryDate: 1 }); // Sort so the items expiring the soonest appear at the top

    return res.status(200).json({
      success: true,
      count: expiringItems.length,
      data: expiringItems,
    });

  } catch (error) {
    console.error('Error fetching expiring items:', error);
    return res.status(500).json({ message: 'Error fetching expiring items', error: error.message });
  }
};

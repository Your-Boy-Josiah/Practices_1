// ============================================================
//  SeedData.js
//  Wipes the database and populates it with dummy test data.
//  Run this manually via terminal: node Utils/SeedData.js
// ============================================================

require('dotenv').config(); // Loads your .env variables (MONGO_URI)
const PM = require('mongoose');

// Import your models (Update these paths if your files are named differently)
const User = require('../Models/User'); 
const Product = require('../Models/Products');

const seedDatabase = async () => {
  try {
    // 1. Connect to the database
    await PM.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for Seeding...');

    // 2. Wipe the existing data clean to prevent duplicates
    await User.deleteMany();
    await Product.deleteMany();
    console.log('🗑️  Old data cleared.');

    // 3. Create Dummy Users
    // (Assuming your User model hashes passwords automatically before saving)
    const users = await User.create([
      {
        name: 'John SuperAdmin',
        email: 'superadmin@store.com',
        password: 'password123', // Use a simple password for testing
        role: 'Super_Admin',
        isActive: true,
      },
      {
        name: 'Sarah StoreKeeper',
        email: 'storekeeper@store.com',
        password: 'password123',
        role: 'Store_Keeper',
        isActive: true,
      },
      {
        name: 'Mike Cashier',
        email: 'cashier@store.com',
        password: 'password123',
        role: 'User', // Your POS cashier role
        isActive: true,
      }
    ]);
    console.log('👥 Dummy Users Created!');

    // 4. Create Dummy Products
    await Product.create([
      {
        name: 'Coca Cola 50cl',
        barcode: '123456789012',
        sku: 'BEV-COKE-50',
        category: 'Beverages',
        costPrice: 150,
        sellingPrice: 300,
        quantity: 50,
        unit: 'pcs',
        reorderLevel: 10,
        isPerishable: false,
        supplierId: 'SUP-001',
        isActive: true,
      },
      {
        name: 'Fresh Loaf Bread',
        barcode: '987654321098',
        sku: 'BAK-BRD-01',
        category: 'Bakery',
        costPrice: 500,
        sellingPrice: 800,
        quantity: 20,
        unit: 'pcs',
        reorderLevel: 5,
        isPerishable: true,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        supplierId: 'SUP-002',
        isActive: true,
      },
      {
        name: 'Peak Milk Powder 400g',
        barcode: '456123789000',
        sku: 'DRY-MILK-400',
        category: 'Dairy',
        costPrice: 2000,
        sellingPrice: 2800,
        quantity: 15,
        unit: 'pcs',
        reorderLevel: 10,
        isPerishable: false,
        supplierId: 'SUP-003',
        isActive: true,
      }
    ]);
    console.log('📦 Dummy Products Created!');

    // 5. Safely disconnect
    console.log('🎉 Seeding Complete! Disconnecting...');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Execute the seeder
seedDatabase();

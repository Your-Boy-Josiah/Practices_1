// ===============================================================
//  Product.js
//  Mongoose model defining the schema for supermarket inventory.
//  Handles core product details, POS barcode indexing, stock levels,
//  and dynamic virtual properties (like profit margins).
// ===============================================================

const PM = require('mongoose'); 

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const productSchema = new PM.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true, // Indexed for faster text-based search queries
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required for scanning'],
      unique: true,
      trim: true,
      index: true, // Indexed for lightning-fast Point-of-Sale (POS) lookups
    },
    image: {
      type: String,
      default: 'uploads/default-product.png',
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // IMPORTANT: Allows SKU to be optional without crashing the 'unique' rule if left null
      index: true
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'Bakery',
        'Beverages',
        'Canned Goods',
        'Dairy',
        'Frozen Foods',
        'Meat & Seafood',
        'Farm Produce',
        'Snacks',
        'Household',
        'Personal Care',
        'Other',
      ],
      index: true, // Indexed to speed up category-based frontend filtering
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    supplierId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity in stock is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'g', 'liter', 'ml', 'pack', 'box', 'can', 'bottle'],
      default: 'pcs',
    },
    size: {
      type: String,
      trim: true,
      default: null, // Captures descriptive sizes (e.g., '500ml', '2kg', 'Pack of 6')
    },
    reorderLevel: {
      type: Number,
      default: 10, // The threshold quantity that triggers a low-stock alert
      min: [0, 'Reorder level cannot be negative'],
    },
    isPerishable: {
      type: Boolean,
      default: false, // Flags items that can spoil (dairy, produce, meat)
    },
    expiryDate: {
      type: Date,
      default: null, // Required if isPerishable is true (handled in business logic)
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true, 
      // Soft delete mechanism: set to false instead of permanently deleting products to preserve sales history
    },
  },
  // ============================================================
  // SCHEMA OPTIONS
  // ============================================================
  { 
    timestamps: true,              // Automatically adds 'createdAt' and 'updatedAt' fields
    toJSON: { virtuals: true },    // Tells Mongoose to include virtuals in API JSON responses
    toObject: { virtuals: true }   // Tells Mongoose to include virtuals in standard console.logs
  }
);

// ============================================================
// VIRTUAL PROPERTIES
// Dynamic fields that are computed on-the-fly when requested.
// These are NOT saved to the MongoDB database, saving space.
// ============================================================

// Virtual: Check if product is low on stock
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel; // Returns true if current stock is at or below the warning threshold
});

// Virtual: Calculate profit margin per unit
productSchema.virtual('profitPerUnit').get(function () {  
  return this.sellingPrice - this.costPrice; // Calculates gross profit per item sold
});

// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable model and exports it
// ============================================================

const Product = PM.model('Product', productSchema); 

module.exports = Product;


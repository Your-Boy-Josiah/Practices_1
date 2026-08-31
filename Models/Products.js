const PM = require('mongoose');

const productSchema = new PM.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required for scanning'],
      unique: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, // This is important! It allows the SKU to be optional without crashing the 'unique' rule
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
      index: true,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
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
      default: null, // e.g., '500ml', '2kg', 'Pack of 6'
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    isPerishable: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true, // Set to false instead of deleting products with sales history
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },    // Tells Mongoose to include virtuals in API responses
    toObject: { virtuals: true }   // Tells Mongoose to include virtuals in standard console.logs
  }
);

// Virtual: Check if product is low on stock
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel;
});

// Virtual: Calculate profit margin per unit
productSchema.virtual('profitPerUnit').get(function () {
  return this.sellingPrice - this.costPrice;
});

//Create a model from Schema
const Product = PM.model('Product', productSchema); 

//Date of creation and update will be automatically added to the documentation
module.exports = Product;  //export the model to be used in other files

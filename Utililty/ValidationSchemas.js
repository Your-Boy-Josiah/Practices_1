const { z } = require('zod');

const CATEGORY_VALUES = [
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
];

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

const dateString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Must be a valid date string',
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const userCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  gender: z.enum(['Male', 'Female', 'Transgender', 'Non-binary', 'Other']),
  phone_number: z.string().trim().min(5),
  age: z.coerce.number().int().min(16),
});

const userLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

const productsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

const barcodeParamSchema = z.object({
  barcode: z.string().trim().min(1),
});

const productIdParamSchema = z.object({
  id: objectId,
});

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().trim().min(1),
  sku: z.string().trim().min(1).optional(),
  category: z.enum(CATEGORY_VALUES),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  unit: z.enum(['pcs', 'kg', 'g', 'liter', 'ml', 'pack', 'box', 'can', 'bottle']).optional(),
  size: z.string().trim().optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  isPerishable: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  expiryDate: dateString.optional(),
  description: z.string().trim().optional(),
  supplierId: objectId,
});

const updateProductSchema = createProductSchema.partial();

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1),
  paymentMethod: z.enum(['Cash', 'Card', 'Mobile Transfer', 'POS']),
});

const restockSchema = z.object({
  productId: objectId,
  supplierId: objectId,
  quantityAdded: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().min(0),
  batchNumber: z.string().trim().optional(),
  expiryDate: dateString.optional(),
  notes: z.string().trim().optional(),
});

module.exports = {
  userCreateSchema,
  userLoginSchema,
  refreshTokenSchema,
  productsQuerySchema,
  barcodeParamSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  checkoutSchema,
  restockSchema,
  paginationQuerySchema,
};

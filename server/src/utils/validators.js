const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.enum(['RESTAURANT', 'SUPERMARKET', 'GROCERY', 'HOSPITAL', 'UNIVERSITY', 'SCHOOL', 'OTHER']),
  businessTypeOther: z.string().optional(),
  contactPerson: z.string().min(1, 'Contact person is required'),
  businessEmail: z.string().email('Invalid business email'),
  businessPhone: z.string().min(1, 'Business phone is required'),
  address: z.string().min(1, 'Address is required'),
});

const createOrderSchema = z.object({
  clientId: z.string().uuid().optional(),
  deliveryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid delivery date',
  }),
  specialInstructions: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        qualityGradeId: z.string().uuid('Invalid quality grade ID'),
        quantity: z.number().positive('Quantity must be positive'),
        specialInstructions: z.string().optional(),
      })
    )
    .min(1, 'At least one item is required'),
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  subDescription: z.string().optional(),
  category: z.enum([
    'FRUITS',
    'VEGETABLES',
    'MEATS',
    'DAIRY',
    'DRY_GOODS',
    'BEVERAGES',
    'FROZEN',
    'OTHER',
  ]),
  unit: z.string().min(1, 'Unit is required'),
  imageUrl: z.string().url().optional().nullable(),
  qualityGrades: z
    .array(
      z.object({
        grade: z.enum(['EXTRA', 'A', 'B', 'C_PLUS_PLUS', 'C']),
        clientFacingGrade: z.enum(['EXTRA', 'QUALITY_A', 'QUALITY_C']),
        price: z.number().positive('Price must be positive'),
        currentStock: z.number().min(0).optional(),
      })
    )
    .optional(),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID').optional().nullable(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().positive('Quantity must be positive'),
        unitPrice: z.number().min(0, 'Unit price cannot be negative'),
      })
    )
    .min(1, 'At least one item is required'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
});

module.exports = {
  loginSchema,
  registerSchema,
  createOrderSchema,
  createProductSchema,
  createPurchaseOrderSchema,
  updateOrderStatusSchema,
};

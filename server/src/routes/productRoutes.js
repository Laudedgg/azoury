const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listProducts,
  getProduct,
  createProduct,
  bulkCreateProducts,
  updateProduct,
  deleteProduct,
  updateQualityGradePrice,
} = require('../controllers/productController');

const adminOnly = requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER');

router.use(authenticate);

// Catalog reads are available to any authenticated user (including client roles)
router.get('/', listProducts);
router.get('/:id', getProduct);

// Writes are restricted to internal admin roles
router.post('/', adminOnly, createProduct);
router.post('/bulk', adminOnly, bulkCreateProducts);
router.put('/:id', adminOnly, updateProduct);
router.delete('/:id', adminOnly, deleteProduct);
router.patch('/grades/:gradeId', adminOnly, updateQualityGradePrice);

module.exports = router;

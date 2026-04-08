const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateQualityGradePrice,
} = require('../controllers/productController');

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER'));

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/grades/:gradeId', updateQualityGradePrice);

module.exports = router;

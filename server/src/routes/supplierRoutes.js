const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getRatingsHistory,
  addRating,
  getPriceComparison,
  createPurchaseOrder,
  listPurchaseOrders,
  updatePurchaseOrderStatus,
  getPriceSurveys,
  createPriceSurvey,
} = require('../controllers/supplierController');

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL'));

router.get('/', listSuppliers);
router.get('/price-comparison', getPriceComparison);
router.get('/price-surveys', getPriceSurveys);
router.post('/price-surveys', createPriceSurvey);
router.get('/purchase-orders', listPurchaseOrders);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.get('/:id/ratings', getRatingsHistory);
router.post('/:id/ratings', addRating);
router.post('/purchase-orders', createPurchaseOrder);
router.patch('/purchase-orders/:id/status', updatePurchaseOrderStatus);

module.exports = router;

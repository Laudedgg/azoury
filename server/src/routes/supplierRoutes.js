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
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  getPriceSurveys,
  createPriceSurvey,
} = require('../controllers/supplierController');

router.use(authenticate);

// Most supplier admin actions stay scoped to purchasing/QC
const supplierScope = requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL');
// Receiving needs to view and mark POs received too
const receivingScope = requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL', 'RECEIVING');

router.get('/', supplierScope, listSuppliers);
router.get('/price-comparison', supplierScope, getPriceComparison);
router.get('/price-surveys', supplierScope, getPriceSurveys);
router.post('/price-surveys', supplierScope, createPriceSurvey);

router.get('/purchase-orders', receivingScope, listPurchaseOrders);
router.get('/purchase-orders/:id', receivingScope, getPurchaseOrder);
router.post('/purchase-orders', supplierScope, createPurchaseOrder);
router.patch('/purchase-orders/:id/status', receivingScope, updatePurchaseOrderStatus);

router.get('/:id', supplierScope, getSupplier);
router.post('/', supplierScope, createSupplier);
router.put('/:id', supplierScope, updateSupplier);
router.delete('/:id', supplierScope, deleteSupplier);
router.get('/:id/ratings', supplierScope, getRatingsHistory);
router.post('/:id/ratings', supplierScope, addRating);

module.exports = router;

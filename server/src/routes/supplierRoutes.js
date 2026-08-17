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

// Anyone who works with POs, receiving, or dispatch needs to at least SEE the
// supplier list (dropdowns, receive PO flow, etc.)
const supplierReadScope = requireRole(
  'SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL',
  'OPERATIONS_MANAGER', 'RECEIVING', 'ACCOUNTANT'
);

// Admin, purchasing, ops manager can create/edit suppliers on the fly.
// (Requested by afood team: admin + operations manager must be able to add.)
const supplierWriteScope = requireRole(
  'SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER'
);

// Price/PO scopes stay tighter
const priceScope = requireRole('SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL');
const receivingScope = requireRole(
  'SUPER_ADMIN', 'PURCHASE_MANAGER', 'QUALITY_COST_CONTROL', 'RECEIVING'
);

router.get('/', supplierReadScope, listSuppliers);
router.get('/price-comparison', priceScope, getPriceComparison);
router.get('/price-surveys', priceScope, getPriceSurveys);
router.post('/price-surveys', priceScope, createPriceSurvey);

router.get('/purchase-orders', receivingScope, listPurchaseOrders);
router.get('/purchase-orders/:id', receivingScope, getPurchaseOrder);
router.post('/purchase-orders', priceScope, createPurchaseOrder);
router.patch('/purchase-orders/:id/status', receivingScope, updatePurchaseOrderStatus);

router.get('/:id', supplierReadScope, getSupplier);
router.post('/', supplierWriteScope, createSupplier);
router.put('/:id', supplierWriteScope, updateSupplier);
router.delete('/:id', supplierWriteScope, deleteSupplier);
router.get('/:id/ratings', supplierReadScope, getRatingsHistory);
router.post('/:id/ratings', supplierWriteScope, addRating);

module.exports = router;

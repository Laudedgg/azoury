const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder,
  listOrders,
  getOrder,
  updateStatus,
  prepareOrder,
  cancelOrder,
  getCombinedOrdersView,
  getReturnAmendments,
  createReturnAmendment,
  updateReturnAmendment,
  verifyOrderItemQc,
  captureItemDelivery,
} = require('../controllers/orderController');

router.use(authenticate);

router.get('/', listOrders);
router.get('/combined', getCombinedOrdersView);
router.get('/returns', getReturnAmendments);
router.post('/returns', createReturnAmendment);
router.patch('/returns/:id', updateReturnAmendment);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateStatus);
router.patch('/:id/prepare', prepareOrder);
router.patch('/:id/cancel', cancelOrder);

// Per-order-item QC and delivery capture
router.patch('/items/:itemId/qc', verifyOrderItemQc);
router.patch('/items/:itemId/delivery', captureItemDelivery);

module.exports = router;

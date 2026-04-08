const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder,
  listOrders,
  getOrder,
  updateStatus,
  cancelOrder,
  getCombinedOrdersView,
} = require('../controllers/orderController');

router.use(authenticate);

router.get('/', listOrders);
router.get('/combined', getCombinedOrdersView);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateStatus);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;

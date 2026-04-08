const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  getStockLevels,
  recordMovement,
  getMovementHistory,
  createSpotCheck,
  listSpotChecks,
  getLowStockAlerts,
} = require('../controllers/inventoryController');

router.use(authenticate);
router.use(
  requireRole(
    'SUPER_ADMIN',
    'PURCHASE_MANAGER',
    'OPERATIONS_MANAGER',
    'QUALITY_COST_CONTROL',
    'RECEIVING',
    'LOGISTICS_TEAM',
    'DRIVER',
    'ACCOUNTANT'
  )
);

router.get('/stock', getStockLevels);
router.get('/movements', getMovementHistory);
router.get('/low-stock', getLowStockAlerts);
router.get('/spot-checks', listSpotChecks);
router.post('/movements', recordMovement);
router.post('/spot-checks', createSpotCheck);

module.exports = router;

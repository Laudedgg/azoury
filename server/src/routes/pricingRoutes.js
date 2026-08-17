const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listGradePricing,
  updateGradePricing,
  setClientPriceOverride,
  listClientPriceOverrides,
  removeClientPriceOverride,
} = require('../controllers/pricingController');

router.use(authenticate);
router.use(
  requireRole(
    'SUPER_ADMIN',
    'PURCHASE_MANAGER',
    'OPERATIONS_MANAGER',
    'ACCOUNTANT'
  )
);

router.get('/grades', listGradePricing);
router.patch('/grades/:gradeId', updateGradePricing);

router.get('/client/:clientId', listClientPriceOverrides);
router.post('/client/:clientId', setClientPriceOverride);
router.delete('/client/:clientId/override/:overrideId', removeClientPriceOverride);

module.exports = router;

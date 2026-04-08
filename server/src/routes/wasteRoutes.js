const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  recordWaste,
  listWaste,
  authorizeWaste,
  getWasteAnalytics,
} = require('../controllers/wasteController');

router.use(authenticate);
router.use(requireRole('OPERATIONS_MANAGER', 'QUALITY_COST_CONTROL'));

router.get('/', listWaste);
router.get('/analytics', getWasteAnalytics);
router.post('/', recordWaste);
router.patch('/:id/authorize', authorizeWaste);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  getDashboardKPIs,
  revenueByPeriod,
  costVsRevenueByGrade,
  topClients,
  deliveryPerformance,
  marginAnalysis,
} = require('../controllers/reportController');

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ACCOUNTANT'));

router.get('/dashboard', getDashboardKPIs);
router.get('/revenue', revenueByPeriod);
router.get('/cost-vs-revenue', costVsRevenueByGrade);
router.get('/top-clients', topClients);
router.get('/delivery-performance', deliveryPerformance);
router.get('/margin-analysis', marginAnalysis);

module.exports = router;

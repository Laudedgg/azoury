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
  getActivityFeed,
  getInvoices,
  updateInvoiceStatus,
  missingItems,
} = require('../controllers/reportController');

router.use(authenticate);

const internalRoles = ['SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER', 'QUALITY_COST_CONTROL', 'RECEIVING', 'LOGISTICS_TEAM', 'ACCOUNTANT'];
const financialRoles = ['SUPER_ADMIN', 'ACCOUNTANT'];

// Accessible to all internal roles
router.get('/dashboard', requireRole(...internalRoles), getDashboardKPIs);
router.get('/activity', requireRole(...internalRoles), getActivityFeed);
router.get('/missing-items', requireRole(...internalRoles), missingItems);

// Financial reports - restricted to SUPER_ADMIN and ACCOUNTANT
router.get('/revenue', requireRole(...financialRoles), revenueByPeriod);
router.get('/cost-vs-revenue', requireRole(...financialRoles), costVsRevenueByGrade);
router.get('/top-clients', requireRole(...financialRoles), topClients);
router.get('/delivery-performance', requireRole(...financialRoles), deliveryPerformance);
router.get('/margin-analysis', requireRole(...financialRoles), marginAnalysis);

// Invoice endpoints - restricted to SUPER_ADMIN and ACCOUNTANT
router.get('/invoices', requireRole(...financialRoles), getInvoices);
router.patch('/invoices/:id', requireRole(...financialRoles), updateInvoiceStatus);

module.exports = router;

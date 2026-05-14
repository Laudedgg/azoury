const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { upload } = require('../middleware/upload');
const {
  createDispatch,
  assignOrders,
  updateStatus,
  uploadPhoto,
  getDispatch,
  listDispatches,
  confirmDelivery,
  getDispatchQcChecklist,
} = require('../controllers/dispatchController');

router.use(authenticate);
router.use(requireRole('OPERATIONS_MANAGER', 'LOGISTICS_TEAM', 'DRIVER'));

router.get('/', listDispatches);
router.get('/:id/qc-checklist', getDispatchQcChecklist);
router.get('/:id', getDispatch);
router.post('/', createDispatch);
router.post('/:id/assign-orders', assignOrders);
router.patch('/:id/status', updateStatus);
router.post('/:id/photos', upload.single('photo'), uploadPhoto);
router.post('/confirm-delivery', confirmDelivery);

module.exports = router;

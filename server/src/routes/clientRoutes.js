const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  approveClient,
  listClientStaff,
  addStaffToClient,
} = require('../controllers/clientController');

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'OPERATIONS_MANAGER'));

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.patch('/:id/approve', approveClient);
router.get('/:id/staff', listClientStaff);
router.post('/:id/staff', addStaffToClient);

module.exports = router;

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

const adminScope = requireRole('SUPER_ADMIN', 'OPERATIONS_MANAGER');
// Client admins can read/manage their OWN organization (controllers verify clientId match)
const clientAdminScope = requireRole('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'CLIENT_ADMIN');

router.get('/', adminScope, listClients);
router.post('/', adminScope, createClient);
router.put('/:id', adminScope, updateClient);
router.delete('/:id', adminScope, deleteClient);
router.patch('/:id/approve', adminScope, approveClient);

// Self-scoped for CLIENT_ADMIN; controllers reject cross-org access
router.get('/:id', clientAdminScope, getClient);
router.get('/:id/staff', clientAdminScope, listClientStaff);
router.post('/:id/staff', clientAdminScope, addStaffToClient);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  updateRole,
  listByRole,
} = require('../controllers/userController');

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

router.get('/', listUsers);
router.get('/role/:role', listByRole);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-active', toggleActive);
router.patch('/:id/role', updateRole);

module.exports = router;

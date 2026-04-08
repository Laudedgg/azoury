const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  logMaintenance,
  getFleetStats,
  updateFuel,
} = require('../controllers/fleetController');

router.use(authenticate);
router.use(requireRole('QUALITY_COST_CONTROL', 'SUPER_ADMIN'));

router.get('/', listVehicles);
router.get('/stats', getFleetStats);
router.get('/:id', getVehicle);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.post('/:id/maintenance', logMaintenance);
router.patch('/:id/fuel', updateFuel);

module.exports = router;

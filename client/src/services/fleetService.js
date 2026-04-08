import api from './api';

export const getVehicles = () => {
  return api.get('/fleet/vehicles');
};

export const getVehicle = (id) => {
  return api.get(`/fleet/vehicles/${id}`);
};

export const createVehicle = (data) => {
  return api.post('/fleet/vehicles', data);
};

export const logMaintenance = (data) => {
  return api.post('/fleet/maintenance', data);
};

export const getFleetStats = () => {
  return api.get('/fleet/stats');
};

export default { getVehicles, getVehicle, createVehicle, logMaintenance, getFleetStats };

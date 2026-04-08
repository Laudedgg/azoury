import api from './api';

export const getStockLevels = (params) => {
  return api.get('/inventory/stock', { params });
};

export const recordMovement = (data) => {
  return api.post('/inventory/movements', data);
};

export const getMovements = (params) => {
  return api.get('/inventory/movements', { params });
};

export const getSpotChecks = () => {
  return api.get('/inventory/spot-checks');
};

export const createSpotCheck = (data) => {
  return api.post('/inventory/spot-checks', data);
};

export const getLowStockAlerts = () => {
  return api.get('/inventory/alerts/low-stock');
};

export default { getStockLevels, recordMovement, getMovements, getSpotChecks, createSpotCheck, getLowStockAlerts };

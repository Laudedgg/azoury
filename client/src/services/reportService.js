import api from './api';

export const getDashboardKPIs = () => {
  return api.get('/reports/kpis');
};

export const getRevenueByPeriod = (params) => {
  return api.get('/reports/revenue', { params });
};

export const getCostVsRevenue = () => {
  return api.get('/reports/cost-vs-revenue');
};

export const getTopClients = () => {
  return api.get('/reports/top-clients');
};

export const getDeliveryPerformance = () => {
  return api.get('/reports/delivery-performance');
};

export const getActivityFeed = () => {
  return api.get('/reports/activity-feed');
};

export default {
  getDashboardKPIs, getRevenueByPeriod, getCostVsRevenue,
  getTopClients, getDeliveryPerformance, getActivityFeed,
};

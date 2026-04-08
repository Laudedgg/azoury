import api from './api';

export const getOrders = (params) => {
  return api.get('/orders', { params });
};

export const getOrder = (id) => {
  return api.get(`/orders/${id}`);
};

export const createOrder = (data) => {
  return api.post('/orders', data);
};

export const updateOrderStatus = (id, status) => {
  return api.patch(`/orders/${id}/status`, { status });
};

export const cancelOrder = (id) => {
  return api.patch(`/orders/${id}/cancel`);
};

export const getCombinedOrders = () => {
  return api.get('/orders/combined');
};

export default { getOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, getCombinedOrders };

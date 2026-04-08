import api from './api';

export const getDispatches = (params) => {
  return api.get('/dispatches', { params });
};

export const createDispatch = (data) => {
  return api.post('/dispatches', data);
};

export const updateDispatchStatus = (id, status) => {
  return api.patch(`/dispatches/${id}/status`, { status });
};

export const uploadPhoto = (dispatchItemId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/dispatches/items/${dispatchItemId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const confirmDelivery = (dispatchItemId, data) => {
  return api.post(`/dispatches/items/${dispatchItemId}/confirm`, data);
};

export default { getDispatches, createDispatch, updateDispatchStatus, uploadPhoto, confirmDelivery };

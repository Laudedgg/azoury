import api from './api';

export const getProducts = (params) => {
  return api.get('/products', { params });
};

export const getProduct = (id) => {
  return api.get(`/products/${id}`);
};

export const createProduct = (data) => {
  return api.post('/products', data);
};

export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data);
};

export const getQualityGrades = (productId) => {
  return api.get(`/products/${productId}/grades`);
};

export default { getProducts, getProduct, createProduct, updateProduct, getQualityGrades };

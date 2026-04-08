import api from './api';

export const getSuppliers = () => {
  return api.get('/suppliers');
};

export const getSupplier = (id) => {
  return api.get(`/suppliers/${id}`);
};

export const createSupplier = (data) => {
  return api.post('/suppliers', data);
};

export const getSupplierRatings = (id) => {
  return api.get(`/suppliers/${id}/ratings`);
};

export const addRating = (data) => {
  return api.post('/suppliers/ratings', data);
};

export const getPriceComparison = (productId) => {
  return api.get(`/suppliers/price-comparison/${productId}`);
};

export const getPriceSurveys = (params) => {
  return api.get('/suppliers/price-surveys', { params });
};

export const addPriceSurvey = (data) => {
  return api.post('/suppliers/price-surveys', data);
};

export default {
  getSuppliers, getSupplier, createSupplier, getSupplierRatings,
  addRating, getPriceComparison, getPriceSurveys, addPriceSurvey,
};

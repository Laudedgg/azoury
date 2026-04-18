import api from './api';

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (data) => {
  return api.post('/auth/register', data);
};

export const refreshToken = () => {
  return api.post('/auth/refresh');
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const changePassword = (currentPassword, newPassword) => {
  return api.post('/auth/change-password', { currentPassword, newPassword });
};

export default { login, register, refreshToken, getMe, logout, changePassword };

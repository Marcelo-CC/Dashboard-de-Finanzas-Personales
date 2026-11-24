import { request } from './client';

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  verifyResetToken: (token) => request(`/auth/reset-password/${encodeURIComponent(token)}`),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: data }),
};

export const categoriesApi = {
  list: (type) => request('/categories', { query: { type } }),
  create: (data) => request('/categories', { method: 'POST', body: data }),
  rename: (id, name) => request(`/categories/${id}`, { method: 'PATCH', body: { name } }),
  remove: (id, replacementId) => request(`/categories/${id}`, { method: 'DELETE', query: { replacementId } }),
};

export const accountsApi = {
  list: () => request('/accounts'),
  create: (data) => request('/accounts', { method: 'POST', body: data }),
  update: (id, data) => request(`/accounts/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
};

export const transactionsApi = {
  list: (filters, opts = {}) => request('/transactions', { query: filters, ...opts }),
  create: (data) => request('/transactions', { method: 'POST', body: data }),
  update: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
};

export const budgetsApi = {
  status: (month) => request(`/budgets/${month}`),
  save: (month, amount) => request('/budgets', { method: 'PUT', body: { month, amount } }),
  remove: (month) => request(`/budgets/${month}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  summary: (month) => request('/dashboard/summary', { query: { month } }),
  charts: (month, months = 6) => request('/dashboard/charts', { query: { month, months } }),
};

export const adminApi = {
  users: () => request('/admin/users'),
  changeRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setActive: (id, active) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: { active } }),
};

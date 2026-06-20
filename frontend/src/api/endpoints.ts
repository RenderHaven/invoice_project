import { api } from './client';
import type { AuthPayload, User, UserRole } from '../types';

export const endpoints = {
  login: (payload: { email: string; password: string }) => api.post<AuthPayload>('/auth/login', payload),
  register: (payload: { org_name: string; name: string; email: string; password: string }) =>
    api.post<AuthPayload>('/auth/register', payload),
  me: () => api.get<User>('/auth/me'),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    api.put<{ message: string }>('/auth/change-password', payload),
  users: () => api.get<User[]>('/users'),
  createUser: (payload: { name: string; email: string; password: string; role: UserRole }) => api.post<User>('/users', payload),
  deleteUser: (id: string) => api.delete<{ message: string }>(`/users/${id}`),
  resetUserPassword: (id: string, payload: { new_password: string }) => api.put<{ message: string }>(`/users/${id}/reset-password`, payload),
  dashboard: () => api.get('/dashboard'),
  revenueTrend: (period = 'monthly') => api.get(`/dashboard/revenue-trend?period=${period}`),
  expenseTrend: () => api.get('/dashboard/expense-trend'),
  invoiceStatus: () => api.get('/dashboard/invoice-status'),
  topCustomers: () => api.get('/dashboard/top-customers'),
  topVendors: () => api.get('/dashboard/top-vendors'),
  customers: () => api.get('/customers'),
  vendors: () => api.get('/vendors'),
  items: () => api.get('/items'),
  categories: () => api.get('/categories'),
  quotations: () => api.get('/quotations'),
  invoices: () => api.get('/invoices'),
  payments: () => api.get('/payments'),
  expenses: () => api.get('/expenses'),
  gst: () => api.get('/gst/summary'),
  documents: () => api.get('/documents'),
  uploadDocument: (payload: FormData) => api.post('/documents/upload', payload),
  extractDocument: (id: string) => api.post(`/documents/${id}/extract`),
};

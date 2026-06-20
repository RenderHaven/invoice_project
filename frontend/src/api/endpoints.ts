import { api } from './client';
import type {
  ApiCategory,
  ApiDocument,
  ApiExpense,
  ApiInvoice,
  ApiItem,
  ApiOrganization,
  ApiParty,
  ApiPayment,
  ApiQuotation,
  AuthPayload,
  CategoryInput,
  DashboardSummary,
  ExpenseInput,
  GstSummary,
  InvoiceInput,
  InvoiceStatusSummary,
  ItemInput,
  OrganizationInput,
  PartyInput,
  PaymentInput,
  QuotationInput,
  TopCustomer,
  TrendPoint,
  User,
  UserRole,
} from '../types';

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const endpoints = {
  // ---- Auth ----
  login: (payload: { email: string; password: string }) => api.post<AuthPayload>('/auth/login', payload),
  register: (payload: { org_name: string; name: string; email: string; password: string }) =>
    api.post<AuthPayload>('/auth/register', payload),
  me: () => api.get<User>('/auth/me'),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    api.put<{ message: string }>('/auth/change-password', payload),

  // ---- Users (admin) ----
  users: () => api.get<User[]>('/users'),
  createUser: (payload: { name: string; email: string; password: string; role: UserRole }) =>
    api.post<User>('/users', payload),
  deleteUser: (id: string) => api.delete<{ message: string }>(`/users/${id}`),
  resetUserPassword: (id: string, payload: { new_password: string }) =>
    api.put<{ message: string }>(`/users/${id}/reset-password`, payload),

  // ---- Organization ----
  organization: () => api.get<ApiOrganization>('/organization'),
  updateOrganization: (payload: OrganizationInput) => api.put<ApiOrganization>('/organization', payload),

  // ---- Customers ----
  customers: (search?: string) => api.get<ApiParty[]>(`/customers${qs({ search })}`),
  createCustomer: (payload: PartyInput) => api.post<ApiParty>('/customers', payload),
  updateCustomer: (id: string, payload: Partial<PartyInput>) => api.put<ApiParty>(`/customers/${id}`, payload),
  deleteCustomer: (id: string) => api.delete<{ message: string }>(`/customers/${id}`),

  // ---- Vendors ----
  vendors: (search?: string) => api.get<ApiParty[]>(`/vendors${qs({ search })}`),
  createVendor: (payload: PartyInput) => api.post<ApiParty>('/vendors', payload),
  updateVendor: (id: string, payload: Partial<PartyInput>) => api.put<ApiParty>(`/vendors/${id}`, payload),
  deleteVendor: (id: string) => api.delete<{ message: string }>(`/vendors/${id}`),

  // ---- Categories ----
  categories: (type?: string) => api.get<ApiCategory[]>(`/categories${qs({ type })}`),
  createCategory: (payload: CategoryInput) => api.post<ApiCategory>('/categories', payload),
  updateCategory: (id: string, payload: Partial<CategoryInput>) => api.put<ApiCategory>(`/categories/${id}`, payload),
  deleteCategory: (id: string) => api.delete<{ message: string }>(`/categories/${id}`),

  // ---- Items ----
  items: (params: { type?: string; search?: string } = {}) => api.get<ApiItem[]>(`/items${qs(params)}`),
  createItem: (payload: ItemInput) => api.post<ApiItem>('/items', payload),
  updateItem: (id: string, payload: Partial<ItemInput>) => api.put<ApiItem>(`/items/${id}`, payload),
  deleteItem: (id: string) => api.delete<{ message: string }>(`/items/${id}`),

  // ---- Quotations ----
  quotations: (status?: string) => api.get<ApiQuotation[]>(`/quotations${qs({ status })}`),
  getQuotation: (id: string) => api.get<ApiQuotation>(`/quotations/${id}`),
  createQuotation: (payload: QuotationInput) => api.post<ApiQuotation>('/quotations', payload),
  updateQuotation: (id: string, payload: Partial<QuotationInput>) => api.put<ApiQuotation>(`/quotations/${id}`, payload),
  deleteQuotation: (id: string) => api.delete<{ message: string }>(`/quotations/${id}`),
  acceptQuotation: (id: string) => api.post<ApiQuotation>(`/quotations/${id}/accept`),
  rejectQuotation: (id: string) => api.post<ApiQuotation>(`/quotations/${id}/reject`),
  convertQuotation: (id: string) => api.post<ApiInvoice>(`/quotations/${id}/convert`),
  quotationPdfUrl: (id: string) => `/api/v1/quotations/${id}/pdf`,

  // ---- Invoices ----
  invoices: (status?: string) => api.get<ApiInvoice[]>(`/invoices${qs({ status })}`),
  getInvoice: (id: string) => api.get<ApiInvoice>(`/invoices/${id}`),
  createInvoice: (payload: InvoiceInput) => api.post<ApiInvoice>('/invoices', payload),
  updateInvoice: (id: string, payload: Partial<InvoiceInput>) => api.put<ApiInvoice>(`/invoices/${id}`, payload),
  markInvoiceSent: (id: string) => api.post<ApiInvoice>(`/invoices/${id}/mark-sent`),
  markInvoicePaid: (id: string) => api.post<ApiInvoice>(`/invoices/${id}/mark-paid`),
  cancelInvoice: (id: string) => api.post<ApiInvoice>(`/invoices/${id}/cancel`),
  invoicePdfUrl: (id: string) => `/api/v1/invoices/${id}/pdf`,

  // ---- Payments ----
  payments: (invoiceId?: string) => api.get<ApiPayment[]>(`/payments${qs({ invoice_id: invoiceId })}`),
  createPayment: (payload: PaymentInput) => api.post<ApiPayment>('/payments', payload),
  deletePayment: (id: string) => api.delete<{ message: string }>(`/payments/${id}`),

  // ---- Expenses ----
  expenses: () => api.get<ApiExpense[]>('/expenses'),
  createExpense: (payload: ExpenseInput) => api.post<ApiExpense>('/expenses', payload),
  updateExpense: (id: string, payload: Partial<ExpenseInput>) => api.put<ApiExpense>(`/expenses/${id}`, payload),
  deleteExpense: (id: string) => api.delete<{ message: string }>(`/expenses/${id}`),

  // ---- Documents (AI extraction) ----
  documents: () => api.get<ApiDocument[]>('/documents'),
  uploadDocument: (payload: FormData) => api.post<ApiDocument>('/documents/upload', payload),
  extractDocument: (id: string) => api.post(`/documents/${id}/extract`),
  reprocessDocument: (id: string) => api.post(`/documents/${id}/reprocess`),
  documentExtraction: (id: string) => api.get(`/documents/${id}/extraction`),

  // ---- Dashboard ----
  dashboard: () => api.get<DashboardSummary>('/dashboard'),
  revenueTrend: (period = 'monthly') => api.get<TrendPoint[]>(`/dashboard/revenue-trend?period=${period}`),
  expenseTrend: () => api.get<TrendPoint[]>('/dashboard/expense-trend'),
  invoiceStatus: () => api.get<InvoiceStatusSummary>('/dashboard/invoice-status'),
  topCustomers: () => api.get<TopCustomer[]>('/dashboard/top-customers'),
  topVendors: () =>
    api.get<Array<{ vendor_id: string; business_name: string; total_expenses: string }>>('/dashboard/top-vendors'),

  // ---- GST ----
  gst: () => api.get<GstSummary>('/gst/summary'),
};

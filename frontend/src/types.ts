export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type Id = string;

export type UserRole = 'admin' | 'manager' | 'other';

export type User = {
  id: Id;
  organization_id: Id;
  role: UserRole | string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type Customer = {
  id: Id;
  businessName: string;
  contactPerson: string;
  gstNumber: string;
  email: string;
  phone: string;
  address: string;
  outstanding: number;
  invoices: number;
};

export type Vendor = {
  id: Id;
  businessName: string;
  contactPerson: string;
  gstNumber: string;
  email: string;
  phone: string;
  outstanding: number;
  expenses: number;
};

export type Item = {
  id: Id;
  name: string;
  type: 'Product' | 'Service';
  category: string;
  unit: string;
  salePrice: number;
  gstRate: number;
  description: string;
};

export type DocumentRecord = {
  id: Id;
  fileName: string;
  type: 'Invoice' | 'Receipt' | 'Quotation' | 'Vendor Bill';
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  uploadDate: string;
  confidence: number;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type Invoice = {
  id: Id;
  number: string;
  customer: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  gst: number;
  total: number;
  balance: number;
};

export type Quotation = {
  id: Id;
  number: string;
  customer: string;
  date: string;
  status: QuotationStatus;
  total: number;
};

export type Payment = {
  id: Id;
  invoice: string;
  customer: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque';
  reference: string;
  date: string;
};

export type Expense = {
  id: Id;
  vendor: string;
  category: string;
  date: string;
  amount: number;
  gstAmount: number;
  description: string;
};

export type Category = {
  id: Id;
  name: string;
  type: 'Income' | 'Expense' | 'Item';
  records: number;
};

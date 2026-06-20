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

/* ------------------------------------------------------------------ */
/* API types — shapes returned by / sent to the FastAPI backend.       */
/* These mirror the Pydantic schemas (snake_case) and are what every   */
/* page now uses when talking to the real backend.                     */
/* ------------------------------------------------------------------ */

export type AddressInput = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
};

export type ApiAddress = AddressInput & { id: Id; created_at: string };

export type BankAccountInput = {
  holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
};

export type ApiBankAccount = BankAccountInput & { id: Id; created_at: string };

export type PartyType = 'customer' | 'vendor' | 'both';

export type PartyInput = {
  type: PartyType;
  business_name: string;
  contact_person?: string;
  gst_number?: string;
  email?: string;
  phone?: string;
  notes?: string;
  address?: AddressInput;
  bank_account?: BankAccountInput;
};

export type ApiParty = {
  id: Id;
  organization_id: Id;
  type: PartyType | string;
  business_name: string;
  contact_person: string | null;
  gst_number: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  address_id: Id | null;
  bank_account_id: Id | null;
  created_at: string;
  address: ApiAddress | null;
  bank_account: ApiBankAccount | null;
};

export type ApiCategory = {
  id: Id;
  organization_id: Id;
  type: 'product' | 'service' | 'expense' | string;
  name: string;
  created_at: string;
};

export type CategoryInput = { type: 'product' | 'service' | 'expense'; name: string };

export type ApiItem = {
  id: Id;
  organization_id: Id;
  type: 'product' | 'service' | string;
  category_id: Id | null;
  name: string;
  description: string | null;
  unit: string | null;
  sale_price: string | null;
  gst_rate: string | null;
  is_active: boolean;
  created_at: string;
};

export type ItemInput = {
  type: 'product' | 'service';
  category_id?: string | null;
  name: string;
  description?: string;
  unit?: string;
  sale_price?: number | string;
  gst_rate?: number | string;
  is_active?: boolean;
};

export type LineItemInput = {
  item_id?: string | null;
  description?: string;
  quantity: number | string;
  unit_price: number | string;
  gst_rate: number | string;
};

export type ApiLineItem = {
  id: Id;
  item_id: Id | null;
  description: string | null;
  quantity: string;
  unit_price: string;
  gst_rate: string;
  gst_amount: string;
  line_total: string;
};

export type ApiQuotation = {
  id: Id;
  organization_id: Id;
  quotation_number: string;
  customer_id: Id;
  quotation_date: string | null;
  valid_until: string | null;
  status: QuotationStatus | string;
  notes: string | null;
  subtotal: string;
  gst_amount: string;
  total_amount: string;
  created_by: Id;
  created_at: string;
  line_items: ApiLineItem[];
};

export type QuotationInput = {
  customer_id: string;
  quotation_date?: string;
  valid_until?: string;
  notes?: string;
  line_items: LineItemInput[];
};

export type ApiInvoice = {
  id: Id;
  organization_id: Id;
  invoice_number: string;
  customer_id: Id;
  quotation_id: Id | null;
  invoice_date: string | null;
  due_date: string | null;
  status: InvoiceStatus | string;
  notes: string | null;
  subtotal: string;
  gst_amount: string;
  total_amount: string;
  created_by: Id;
  created_at: string;
  line_items: ApiLineItem[];
};

export type InvoiceInput = {
  customer_id: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  line_items: LineItemInput[];
};

export type ApiPayment = {
  id: Id;
  organization_id: Id;
  invoice_id: Id;
  customer_id: Id;
  payment_date: string;
  amount: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

export type PaymentInput = {
  invoice_id: string;
  customer_id: string;
  payment_date: string;
  amount: number | string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
};

export type ApiExpense = {
  id: Id;
  organization_id: Id;
  vendor_id: Id | null;
  category_id: Id | null;
  expense_date: string;
  description: string | null;
  amount: string;
  gst_amount: string;
  payment_method: string | null;
  reference_number: string | null;
  created_by: Id;
  created_at: string;
  attachments: Array<{ id: Id; file_url: string; file_name: string | null }>;
};

export type ExpenseInput = {
  vendor_id?: string | null;
  category_id?: string | null;
  expense_date: string;
  description?: string;
  amount: number | string;
  gst_amount?: number | string;
  payment_method?: string;
  reference_number?: string;
};

export type ApiDocument = {
  id: Id;
  organization_id: Id;
  uploaded_by: Id;
  document_type: 'invoice' | 'quotation' | 'receipt' | 'bill' | string;
  file_url: string | null;
  file_name: string | null;
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | string;
  created_at: string;
};

export type ApiOrganization = {
  id: Id;
  name: string;
  gst_number: string | null;
  email: string | null;
  phone: string | null;
  address_id: Id | null;
  invoice_prefix: string | null;
  quotation_prefix: string | null;
  created_at: string;
  updated_at: string;
  address: ApiAddress | null;
};

export type OrganizationInput = {
  name?: string;
  gst_number?: string;
  email?: string;
  phone?: string;
  invoice_prefix?: string;
  quotation_prefix?: string;
};

export type DashboardSummary = {
  total_revenue: string;
  total_expenses: string;
  net_profit: string;
  total_receivables: string;
  total_payables: string;
  gst_collected: string;
  gst_paid: string;
  net_gst_liability: string;
};

export type InvoiceStatusSummary = {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
};

export type TopCustomer = { customer_id: Id; business_name: string; total_revenue: string };
export type TrendPoint = { period: string; revenue?: string; expenses?: string };

export type GstSummary = {
  gst_collected: string;
  gst_paid: string;
  net_gst_liability: string;
  filters?: { year: number | null; month: number | null };
};

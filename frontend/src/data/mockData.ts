import type { Category, Customer, DocumentRecord, Expense, Invoice, Item, Payment, Quotation, User, Vendor } from '../types';

export const customers: Customer[] = [
  {
    id: 'cus-1',
    businessName: 'Apex Infrastructure',
    contactPerson: 'Ritika Sharma',
    gstNumber: '29AAXCA2190A1Z5',
    email: 'accounts@apexinfra.in',
    phone: '+91 98765 43001',
    address: 'Indiranagar, Bengaluru',
    outstanding: 284000,
    invoices: 18,
  },
  {
    id: 'cus-2',
    businessName: 'Northstar Retail',
    contactPerson: 'Manav Iyer',
    gstNumber: '27AADCN1023E1Z2',
    email: 'finance@northstar.co',
    phone: '+91 98220 11045',
    address: 'Andheri East, Mumbai',
    outstanding: 96000,
    invoices: 11,
  },
  {
    id: 'cus-3',
    businessName: 'Blue Finch Studio',
    contactPerson: 'Farah Khan',
    gstNumber: '07AAFCB3321C1Z9',
    email: 'billing@bluefinch.studio',
    phone: '+91 98111 22444',
    address: 'Saket, New Delhi',
    outstanding: 0,
    invoices: 7,
  },
];

export const vendors: Vendor[] = [
  {
    id: 'ven-1',
    businessName: 'Metro Paper Supply',
    contactPerson: 'Vivek Nair',
    gstNumber: '33AAMFM7781N1Z8',
    email: 'orders@metropaper.in',
    phone: '+91 98840 90010',
    outstanding: 52000,
    expenses: 23,
  },
  {
    id: 'ven-2',
    businessName: 'CloudGrid Services',
    contactPerson: 'Nisha Jain',
    gstNumber: '36AACCC4220F1Z1',
    email: 'billing@cloudgrid.io',
    phone: '+91 97003 22331',
    outstanding: 18500,
    expenses: 9,
  },
];

export const items: Item[] = [
  {
    id: 'itm-1',
    name: 'Consulting Retainer',
    type: 'Service',
    category: 'Professional Services',
    unit: 'Month',
    salePrice: 125000,
    gstRate: 18,
    description: 'Monthly advisory and implementation support',
  },
  {
    id: 'itm-2',
    name: 'Accounting Setup',
    type: 'Service',
    category: 'Implementation',
    unit: 'Project',
    salePrice: 85000,
    gstRate: 18,
    description: 'Chart setup, templates, and migration assistance',
  },
  {
    id: 'itm-3',
    name: 'Thermal Invoice Printer',
    type: 'Product',
    category: 'Hardware',
    unit: 'Piece',
    salePrice: 14400,
    gstRate: 18,
    description: 'Billing counter printer with USB and LAN',
  },
];

export const categories: Category[] = [
  { id: 'cat-1', name: 'Professional Services', type: 'Item', records: 16 },
  { id: 'cat-2', name: 'Office Supplies', type: 'Expense', records: 28 },
  { id: 'cat-3', name: 'Software Subscription', type: 'Expense', records: 12 },
  { id: 'cat-4', name: 'Implementation', type: 'Income', records: 8 },
];

export const users: User[] = [
  {
    id: 'usr-1',
    organization_id: 'org-1',
    role: 'admin',
    name: 'Vikram Admin',
    email: 'admin@example.com',
    is_active: true,
    created_at: '2026-06-01T09:30:00Z',
  },
  {
    id: 'usr-2',
    organization_id: 'org-1',
    role: 'manager',
    name: 'Riya Sharma',
    email: 'riya@mybusiness.com',
    is_active: true,
    created_at: '2026-06-04T11:15:00Z',
  },
  {
    id: 'usr-3',
    organization_id: 'org-1',
    role: 'other',
    name: 'Aman Rao',
    email: 'aman@mybusiness.com',
    is_active: true,
    created_at: '2026-06-08T14:20:00Z',
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'INV-2026-0142',
    customer: 'Apex Infrastructure',
    invoiceDate: '2026-06-03',
    dueDate: '2026-06-18',
    status: 'overdue',
    subtotal: 240000,
    gst: 43200,
    total: 283200,
    balance: 283200,
  },
  {
    id: 'inv-2',
    number: 'INV-2026-0141',
    customer: 'Northstar Retail',
    invoiceDate: '2026-06-08',
    dueDate: '2026-06-23',
    status: 'sent',
    subtotal: 96000,
    gst: 17280,
    total: 113280,
    balance: 113280,
  },
  {
    id: 'inv-3',
    number: 'INV-2026-0140',
    customer: 'Blue Finch Studio',
    invoiceDate: '2026-05-29',
    dueDate: '2026-06-08',
    status: 'paid',
    subtotal: 85000,
    gst: 15300,
    total: 100300,
    balance: 0,
  },
];

export const quotations: Quotation[] = [
  { id: 'quo-1', number: 'QT-2026-0067', customer: 'Apex Infrastructure', date: '2026-06-12', status: 'sent', total: 430700 },
  { id: 'quo-2', number: 'QT-2026-0066', customer: 'Blue Finch Studio', date: '2026-06-10', status: 'accepted', total: 100300 },
  { id: 'quo-3', number: 'QT-2026-0065', customer: 'Northstar Retail', date: '2026-06-02', status: 'draft', total: 164020 },
];

export const payments: Payment[] = [
  {
    id: 'pay-1',
    invoice: 'INV-2026-0140',
    customer: 'Blue Finch Studio',
    amount: 100300,
    method: 'Bank Transfer',
    reference: 'UTR8329201',
    date: '2026-06-05',
  },
  {
    id: 'pay-2',
    invoice: 'INV-2026-0139',
    customer: 'Apex Infrastructure',
    amount: 75000,
    method: 'UPI',
    reference: 'UPI28119',
    date: '2026-06-01',
  },
];

export const expenses: Expense[] = [
  {
    id: 'exp-1',
    vendor: 'Metro Paper Supply',
    category: 'Office Supplies',
    date: '2026-06-07',
    amount: 18400,
    gstAmount: 3312,
    description: 'Printer rolls and stationery',
  },
  {
    id: 'exp-2',
    vendor: 'CloudGrid Services',
    category: 'Software Subscription',
    date: '2026-06-01',
    amount: 32000,
    gstAmount: 5760,
    description: 'Hosting and document processing',
  },
  {
    id: 'exp-3',
    vendor: 'Metro Paper Supply',
    category: 'Office Supplies',
    date: '2026-05-25',
    amount: 12600,
    gstAmount: 2268,
    description: 'Receipt books and envelopes',
  },
];

export const documents: DocumentRecord[] = [
  { id: 'doc-1', fileName: 'metro-paper-june.pdf', type: 'Vendor Bill', status: 'completed', uploadDate: '2026-06-11', confidence: 94 },
  { id: 'doc-2', fileName: 'apex-quote-scan.png', type: 'Quotation', status: 'processing', uploadDate: '2026-06-13', confidence: 71 },
  { id: 'doc-3', fileName: 'travel-receipt.jpg', type: 'Receipt', status: 'failed', uploadDate: '2026-06-09', confidence: 42 },
];

export const monthlyRevenue = [280000, 340000, 310000, 420000, 505000, 476000, 558000];
export const monthlyExpenses = [122000, 148000, 132000, 166000, 192000, 204000, 186000];

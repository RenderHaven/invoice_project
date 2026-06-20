import { FileText, Plus, Send, Upload } from 'lucide-react';
import { Button, Card, DataTable, Field, PageHeader, StatusBadge } from '../components/ui';
import { documents, expenses, invoices, payments, quotations } from '../data/mockData';
import { currency, formatDate, percent } from '../lib/format';
import type { InvoiceStatus, QuotationStatus } from '../types';

const invoiceTone: Record<InvoiceStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'danger',
};

const quotationTone: Record<QuotationStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

export function QuotationsPage() {
  return (
    <>
      <PageHeader title="Quotations" description="Create customer quotes, track acceptance, generate PDFs, and convert approved quotes to invoices." actions={<Button><Plus size={16} />New Quotation</Button>} />
      <DataTable
        rows={quotations}
        getKey={(row) => row.id}
        columns={[
          { key: 'number', label: 'Quotation', render: (row) => <span className="font-semibold text-ink">{row.number}</span> },
          { key: 'customer', label: 'Customer', render: (row) => row.customer },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} tone={quotationTone[row.status]} /> },
          { key: 'total', label: 'Total', align: 'right', render: (row) => currency.format(row.total) },
        ]}
      />
    </>
  );
}

export function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create GST invoices, track status, record balances, generate PDFs, and manage invoice lifecycle actions."
        actions={
          <>
            <Button variant="secondary"><FileText size={16} />Generate PDF</Button>
            <Button><Plus size={16} />New Invoice</Button>
          </>
        }
      />
      <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_400px]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Fast invoice entry</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Customer"><select className="field"><option>Apex Infrastructure</option><option>Northstar Retail</option></select></Field>
            <Field label="Invoice Date"><input className="field" type="date" defaultValue="2026-06-20" /></Field>
            <Field label="Due Date"><input className="field" type="date" defaultValue="2026-07-05" /></Field>
            <Field label="Action"><Button className="w-full"><Send size={16} />Send</Button></Field>
          </div>
        </Card>
        <Card>
          <p className="label">Invoice summary</p>
          <div className="mt-3 space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={currency.format(240000)} />
            <SummaryRow label="GST" value={currency.format(43200)} />
            <SummaryRow label="Grand Total" value={currency.format(283200)} strong />
          </div>
        </Card>
      </div>
      <DataTable
        rows={invoices}
        getKey={(row) => row.id}
        columns={[
          { key: 'number', label: 'Invoice', render: (row) => <span className="font-semibold text-ink">{row.number}</span> },
          { key: 'customer', label: 'Customer', render: (row) => row.customer },
          { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} tone={invoiceTone[row.status]} /> },
          { key: 'balance', label: 'Balance', align: 'right', render: (row) => currency.format(row.balance) },
          { key: 'total', label: 'Total', align: 'right', render: (row) => currency.format(row.total) },
        ]}
      />
    </>
  );
}

export function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments" description="Record full or partial customer payments and keep receivables current." actions={<Button><Plus size={16} />Record Payment</Button>} />
      <DataTable
        rows={payments}
        getKey={(row) => row.id}
        columns={[
          { key: 'invoice', label: 'Invoice', render: (row) => <span className="font-semibold text-ink">{row.invoice}</span> },
          { key: 'customer', label: 'Customer', render: (row) => row.customer },
          { key: 'method', label: 'Method', render: (row) => <StatusBadge label={row.method} tone="info" /> },
          { key: 'reference', label: 'Reference', render: (row) => row.reference },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'amount', label: 'Amount', align: 'right', render: (row) => currency.format(row.amount) },
        ]}
      />
    </>
  );
}

export function ExpensesPage() {
  return (
    <>
      <PageHeader title="Expenses" description="Capture vendor-linked expenses, GST paid, receipt attachments, and expense reports." actions={<Button><Plus size={16} />New Expense</Button>} />
      <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Vendor"><select className="field"><option>All vendors</option><option>Metro Paper Supply</option></select></Field>
            <Field label="Category"><select className="field"><option>All categories</option><option>Office Supplies</option></select></Field>
            <Field label="From"><input className="field" type="date" /></Field>
            <Field label="To"><input className="field" type="date" /></Field>
          </div>
        </Card>
        <UploadBox label="Upload Receipt" />
      </div>
      <DataTable
        rows={expenses}
        getKey={(row) => row.id}
        columns={[
          { key: 'vendor', label: 'Vendor', render: (row) => <span className="font-semibold text-ink">{row.vendor}</span> },
          { key: 'category', label: 'Category', render: (row) => row.category },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'description', label: 'Description', render: (row) => row.description },
          { key: 'gst', label: 'GST', align: 'right', render: (row) => currency.format(row.gstAmount) },
          { key: 'amount', label: 'Amount', align: 'right', render: (row) => currency.format(row.amount) },
        ]}
      />
    </>
  );
}

export function DocumentsPage() {
  return (
    <>
      <PageHeader title="AI Document Center" description="Upload invoices, receipts, quotations, and vendor bills for AI-powered extraction into drafts." actions={<Button><Upload size={16} />Upload Document</Button>} />
      <div className="mb-4 grid gap-4 xl:grid-cols-[360px_1fr]">
        <UploadBox label="Drop PDF, PNG, or JPG" />
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Latest extraction result</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryTile label="Party" value="Metro Paper Supply" />
            <SummaryTile label="GST" value={currency.format(3312)} />
            <SummaryTile label="Total" value={currency.format(18400)} />
            <SummaryTile label="Confidence" value={percent(94)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary">Reprocess</Button>
            <Button>Create Expense</Button>
            <Button variant="secondary">Create Invoice</Button>
          </div>
        </Card>
      </div>
      <DataTable
        rows={documents}
        getKey={(row) => row.id}
        columns={[
          { key: 'fileName', label: 'File Name', render: (row) => <span className="font-semibold text-ink">{row.fileName}</span> },
          { key: 'type', label: 'Type', render: (row) => row.type },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge label={row.status} tone={row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'} />,
          },
          { key: 'uploadDate', label: 'Upload Date', render: (row) => formatDate(row.uploadDate) },
          { key: 'confidence', label: 'Confidence', align: 'right', render: (row) => percent(row.confidence) },
        ]}
      />
    </>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'tabular text-lg font-semibold text-ink' : 'tabular font-semibold text-slate'}>{value}</span>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-surface p-3">
      <p className="label">{label}</p>
      <p className="tabular mt-2 font-semibold text-ink">{value}</p>
    </div>
  );
}

function UploadBox({ label }: { label: string }) {
  return (
    <Card>
      <div className="flex min-h-32 flex-col items-center justify-center rounded border border-dashed border-line bg-surface px-4 py-6 text-center">
        <Upload className="text-muted" size={24} />
        <p className="mt-2 text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">PDF, PNG, JPG up to 10 MB</p>
      </div>
    </Card>
  );
}

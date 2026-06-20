import { Check, FileText, Pencil, Plus, RefreshCw, Send, Trash2, Upload, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { endpoints } from '../api/endpoints';
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  InlineSpinner,
  Modal,
  PageHeader,
  Spinner,
  StatusBadge,
  useToast,
} from '../components/ui';
import { currency, formatDate, formatDateTime } from '../lib/format';
import { getSessionUser } from '../lib/session';
import { useApi } from '../lib/useApi';
import type {
  ApiCategory,
  ApiDocument,
  ApiExpense,
  ApiInvoice,
  ApiItem,
  ApiParty,
  ApiPayment,
  ApiQuotation,
  LineItemInput,
} from '../types';

function canWrite() {
  const role = getSessionUser()?.role;
  return role === 'admin' || role === 'manager';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function num(value: string | null | undefined) {
  return Number(value ?? 0);
}

/**
 * Open an authenticated PDF in a new tab. A plain <a href> can't send the
 * Bearer token, so we fetch the bytes with the token and open a blob URL.
 * The blank window is opened synchronously (inside the click) to dodge popup blockers.
 */
async function openPdfBlob(fetchPdf: () => Promise<Blob>, onError: (message: string) => void) {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchPdf();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    if (win) win.close();
    onError(err instanceof Error ? err.message : 'Could not open PDF');
  }
}

const invoiceTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'danger',
};

const quotationTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

/* --------------------------- Line items editor -------------------------- */

type LineRow = { item_id: string; description: string; quantity: string; unit_price: string; gst_rate: string };

const blankRow: LineRow = { item_id: '', description: '', quantity: '1', unit_price: '0', gst_rate: '0' };

function lineSubtotal(row: LineRow) {
  return Number(row.quantity || 0) * Number(row.unit_price || 0);
}
function lineGst(row: LineRow) {
  return (lineSubtotal(row) * Number(row.gst_rate || 0)) / 100;
}

function LineItemsEditor({ rows, setRows, items }: { rows: LineRow[]; setRows: (rows: LineRow[]) => void; items: ApiItem[] }) {
  function update(index: number, patch: Partial<LineRow>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function onSelectItem(index: number, itemId: string) {
    const item = items.find((it) => it.id === itemId);
    if (item) {
      update(index, {
        item_id: itemId,
        description: item.name,
        unit_price: String(num(item.sale_price)),
        gst_rate: String(num(item.gst_rate)),
      });
    } else {
      update(index, { item_id: '' });
    }
  }

  const subtotal = rows.reduce((sum, row) => sum + lineSubtotal(row), 0);
  const gst = rows.reduce((sum, row) => sum + lineGst(row), 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label">Line Items</p>
        <Button variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => setRows([...rows, { ...blankRow }])}>
          <Plus size={14} />Add line
        </Button>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-12 items-end gap-2 rounded border border-line bg-surface p-2">
            <div className="col-span-12 md:col-span-3">
              <span className="label">Item</span>
              <select className="field mt-1" value={row.item_id} onChange={(e) => onSelectItem(index, e.target.value)}>
                <option value="">Custom</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-12 md:col-span-3">
              <span className="label">Description</span>
              <input className="field mt-1" value={row.description} onChange={(e) => update(index, { description: e.target.value })} />
            </div>
            <div className="col-span-3 md:col-span-1">
              <span className="label">Qty</span>
              <input className="field mt-1" type="number" step="0.01" value={row.quantity} onChange={(e) => update(index, { quantity: e.target.value })} />
            </div>
            <div className="col-span-4 md:col-span-2">
              <span className="label">Unit Price</span>
              <input className="field mt-1" type="number" step="0.01" value={row.unit_price} onChange={(e) => update(index, { unit_price: e.target.value })} />
            </div>
            <div className="col-span-3 md:col-span-1">
              <span className="label">GST %</span>
              <input className="field mt-1" type="number" step="0.01" value={row.gst_rate} onChange={(e) => update(index, { gst_rate: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-2">
              <span className="tabular text-sm font-semibold text-ink">{currency.format(lineSubtotal(row) + lineGst(row))}</span>
              <button type="button" className="rounded border border-line p-1.5 text-rose hover:bg-rose/10" aria-label="Remove line" onClick={() => setRows(rows.filter((_, i) => i !== index))}>
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="rounded border border-dashed border-line bg-surface px-3 py-4 text-center text-sm text-muted">No line items. Add at least one.</p> : null}
      </div>
      <div className="mt-3 flex flex-col items-end gap-1 text-sm">
        <span className="text-muted">Subtotal: <span className="tabular font-semibold text-slate">{currency.format(subtotal)}</span></span>
        <span className="text-muted">GST: <span className="tabular font-semibold text-slate">{currency.format(gst)}</span></span>
        <span className="text-ink">Grand Total: <span className="tabular text-lg font-semibold">{currency.format(subtotal + gst)}</span></span>
      </div>
    </div>
  );
}

function rowsToLineItems(rows: LineRow[]): LineItemInput[] {
  return rows.map((row) => ({
    item_id: row.item_id || null,
    description: row.description || undefined,
    quantity: Number(row.quantity || 0),
    unit_price: Number(row.unit_price || 0),
    gst_rate: Number(row.gst_rate || 0),
  }));
}

function useCustomerLookup() {
  const { data } = useApi<ApiParty[]>(() => endpoints.customers(), []);
  const list = data ?? [];
  const map = useMemo(() => new Map(list.map((c) => [c.id, c.business_name])), [list]);
  return { customers: list, customerName: (id: string) => map.get(id) ?? '—' };
}

/* ------------------------------ Quotations ------------------------------ */

export function QuotationsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, reload } = useApi<ApiQuotation[]>(() => endpoints.quotations(statusFilter || undefined), [statusFilter]);
  const { customers, customerName } = useCustomerLookup();
  const { data: items } = useApi<ApiItem[]>(() => endpoints.items(), []);
  const { show, toast } = useToast();
  const writable = canWrite();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(today());
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<LineRow[]>([{ ...blankRow }]);

  function openCreate() {
    setCustomerId('');
    setQuotationDate(today());
    setValidUntil('');
    setNotes('');
    setRows([{ ...blankRow }]);
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!customerId) {
      setFormError('Select a customer');
      return;
    }
    if (rows.length === 0) {
      setFormError('Add at least one line item');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await endpoints.createQuotation({
        customer_id: customerId,
        quotation_date: quotationDate || undefined,
        valid_until: validUntil || undefined,
        notes: notes || undefined,
        line_items: rowsToLineItems(rows),
      });
      show('success', 'Quotation created');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create quotation');
    } finally {
      setSaving(false);
    }
  }

  async function act(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      show('success', label);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Action failed');
    }
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Quotations"
        description="Create customer quotes, track acceptance, generate PDFs, and convert approved quotes to invoices."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New Quotation</Button> : undefined}
      />
      <Card className="mb-4">
        <Field label="Status">
          <select className="field max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
      </Card>

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No quotations yet" hint={writable ? 'Create a quotation and convert it to an invoice once accepted.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />New Quotation</Button> : undefined} />
      ) : (
        <DataTable
          rows={list}
          getKey={(row) => row.id}
          columns={[
            { key: 'number', label: 'Quotation', render: (row) => <span className="font-semibold text-ink">{row.quotation_number}</span> },
            { key: 'customer', label: 'Customer', render: (row) => customerName(row.customer_id) },
            { key: 'date', label: 'Date', render: (row) => (row.quotation_date ? formatDate(row.quotation_date) : '—') },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} tone={quotationTone[row.status] ?? 'neutral'} /> },
            { key: 'total', label: 'Total', align: 'right', render: (row) => currency.format(num(row.total_amount)) },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <button className="rounded border border-line p-2 text-slate hover:bg-surface" aria-label="PDF" onClick={() => openPdfBlob(() => endpoints.quotationPdf(row.id), (m) => show('danger', m))}><FileText size={15} /></button>
                  {writable && row.status !== 'accepted' && row.status !== 'rejected' ? (
                    <>
                      <button className="rounded border border-line p-2 text-emerald hover:bg-emerald/10" aria-label="Accept" onClick={() => act('Quotation accepted', () => endpoints.acceptQuotation(row.id))}><Check size={15} /></button>
                      <button className="rounded border border-line p-2 text-rose hover:bg-rose/10" aria-label="Reject" onClick={() => act('Quotation rejected', () => endpoints.rejectQuotation(row.id))}><X size={15} /></button>
                    </>
                  ) : null}
                  {writable && row.status === 'accepted' ? (
                    <Button variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => act('Converted to invoice', () => endpoints.convertQuotation(row.id))}>Convert</Button>
                  ) : null}
                  {writable ? (
                    <button className="rounded border border-line p-2 text-rose hover:bg-rose/10" aria-label="Delete" onClick={() => { if (window.confirm('Delete quotation?')) act('Quotation deleted', () => endpoints.deleteQuotation(row.id)); }}><Trash2 size={15} /></button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={open}
        wide
        onClose={() => setOpen(false)}
        title="New Quotation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="quotation-form">{saving ? 'Saving...' : 'Create Quotation'}</Button>
          </>
        }
      >
        <form id="quotation-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Customer">
              <select className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </Field>
            <Field label="Quotation Date"><input className="field" type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} /></Field>
            <Field label="Valid Until"><input className="field" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
          </div>
          <LineItemsEditor rows={rows} setRows={setRows} items={items ?? []} />
          <Field label="Notes"><textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

/* ------------------------------- Invoices ------------------------------- */

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, loading, error, reload } = useApi<ApiInvoice[]>(() => endpoints.invoices(statusFilter || undefined), [statusFilter]);
  const { customers, customerName } = useCustomerLookup();
  const { data: items } = useApi<ApiItem[]>(() => endpoints.items(), []);
  const { show, toast } = useToast();
  const writable = canWrite();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<LineRow[]>([{ ...blankRow }]);

  function openCreate() {
    setCustomerId('');
    setInvoiceDate(today());
    setDueDate('');
    setNotes('');
    setRows([{ ...blankRow }]);
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!customerId) {
      setFormError('Select a customer');
      return;
    }
    if (rows.length === 0) {
      setFormError('Add at least one line item');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await endpoints.createInvoice({
        customer_id: customerId,
        invoice_date: invoiceDate || undefined,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        line_items: rowsToLineItems(rows),
      });
      show('success', 'Invoice created');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create invoice');
    } finally {
      setSaving(false);
    }
  }

  async function act(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      show('success', label);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Action failed');
    }
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create GST invoices, track status, record balances, generate PDFs, and manage invoice lifecycle actions."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New Invoice</Button> : undefined}
      />
      <Card className="mb-4">
        <Field label="Status">
          <select className="field max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </Card>

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No invoices yet" hint={writable ? 'Create your first GST invoice to start tracking receivables.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />New Invoice</Button> : undefined} />
      ) : (
        <DataTable
          rows={list}
          getKey={(row) => row.id}
          columns={[
            { key: 'number', label: 'Invoice', render: (row) => <span className="font-semibold text-ink">{row.invoice_number}</span> },
            { key: 'customer', label: 'Customer', render: (row) => customerName(row.customer_id) },
            { key: 'dueDate', label: 'Due Date', render: (row) => (row.due_date ? formatDate(row.due_date) : '—') },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} tone={invoiceTone[row.status] ?? 'neutral'} /> },
            { key: 'total', label: 'Total', align: 'right', render: (row) => currency.format(num(row.total_amount)) },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <button className="rounded border border-line p-2 text-slate hover:bg-surface" aria-label="PDF" onClick={() => openPdfBlob(() => endpoints.invoicePdf(row.id), (m) => show('danger', m))}><FileText size={15} /></button>
                  {writable && row.status === 'draft' ? (
                    <button className="rounded border border-line p-2 text-amber hover:bg-amber/10" aria-label="Mark sent" onClick={() => act('Marked sent', () => endpoints.markInvoiceSent(row.id))}><Send size={15} /></button>
                  ) : null}
                  {writable && row.status !== 'paid' && row.status !== 'cancelled' ? (
                    <button className="rounded border border-line p-2 text-emerald hover:bg-emerald/10" aria-label="Mark paid" onClick={() => act('Marked paid', () => endpoints.markInvoicePaid(row.id))}><Check size={15} /></button>
                  ) : null}
                  {writable && row.status !== 'paid' && row.status !== 'cancelled' ? (
                    <button className="rounded border border-line p-2 text-rose hover:bg-rose/10" aria-label="Cancel" onClick={() => { if (window.confirm('Cancel invoice?')) act('Invoice cancelled', () => endpoints.cancelInvoice(row.id)); }}><X size={15} /></button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={open}
        wide
        onClose={() => setOpen(false)}
        title="New Invoice"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="invoice-form">{saving ? 'Saving...' : 'Create Invoice'}</Button>
          </>
        }
      >
        <form id="invoice-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Customer">
              <select className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </Field>
            <Field label="Invoice Date"><input className="field" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
            <Field label="Due Date"><input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          </div>
          <LineItemsEditor rows={rows} setRows={setRows} items={items ?? []} />
          <Field label="Notes"><textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

/* ------------------------------- Payments ------------------------------- */

export function PaymentsPage() {
  const { data, loading, error, reload } = useApi<ApiPayment[]>(() => endpoints.payments(), []);
  const { data: invoices } = useApi<ApiInvoice[]>(() => endpoints.invoices(), []);
  const { customerName } = useCustomerLookup();
  const { show, toast } = useToast();
  const writable = canWrite();

  const invoiceList = invoices ?? [];
  const invoiceMap = useMemo(() => new Map(invoiceList.map((inv) => [inv.id, inv])), [invoiceList]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  function openCreate() {
    setInvoiceId('');
    setAmount('');
    setPaymentDate(today());
    setMethod('Bank Transfer');
    setReference('');
    setNotes('');
    setFormError(null);
    setOpen(true);
  }

  function onSelectInvoice(id: string) {
    setInvoiceId(id);
    const inv = invoiceMap.get(id);
    if (inv) setAmount(String(num(inv.total_amount)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const inv = invoiceMap.get(invoiceId);
    if (!inv) {
      setFormError('Select an invoice');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await endpoints.createPayment({
        invoice_id: inv.id,
        customer_id: inv.customer_id,
        payment_date: paymentDate,
        amount: Number(amount || 0),
        payment_method: method,
        reference_number: reference || undefined,
        notes: notes || undefined,
      });
      show('success', 'Payment recorded');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not record payment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(payment: ApiPayment) {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await endpoints.deletePayment(payment.id);
      show('success', 'Payment deleted');
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Record full or partial customer payments and keep receivables current."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />Record Payment</Button> : undefined}
      />

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No payments yet" hint={writable ? 'Record a payment against an invoice to update receivables.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />Record Payment</Button> : undefined} />
      ) : (
        <DataTable
          rows={list}
          getKey={(row) => row.id}
          columns={[
            { key: 'invoice', label: 'Invoice', render: (row) => <span className="font-semibold text-ink">{invoiceMap.get(row.invoice_id)?.invoice_number ?? '—'}</span> },
            { key: 'customer', label: 'Customer', render: (row) => customerName(row.customer_id) },
            { key: 'method', label: 'Method', render: (row) => <StatusBadge label={row.payment_method ?? '—'} tone="info" /> },
            { key: 'reference', label: 'Reference', render: (row) => row.reference_number ?? '—' },
            { key: 'date', label: 'Date', render: (row) => formatDate(row.payment_date) },
            { key: 'amount', label: 'Amount', align: 'right', render: (row) => currency.format(num(row.amount)) },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (row) => (writable ? <button className="rounded border border-line p-2 text-rose hover:bg-rose/10" aria-label="Delete" onClick={() => handleDelete(row)}><Trash2 size={15} /></button> : null),
            },
          ]}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="payment-form">{saving ? 'Saving...' : 'Record Payment'}</Button>
          </>
        }
      >
        <form id="payment-form" className="space-y-3" onSubmit={handleSubmit}>
          <Field label="Invoice">
            <select className="field" value={invoiceId} onChange={(e) => onSelectInvoice(e.target.value)} required>
              <option value="">Select invoice</option>
              {invoiceList.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number} — {currency.format(num(inv.total_amount))}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Amount"><input className="field" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
            <Field label="Payment Date"><input className="field" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></Field>
            <Field label="Payment Method">
              <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
                {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Reference Number"><input className="field" value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

/* ------------------------------- Expenses ------------------------------- */

export function ExpensesPage() {
  const { data, loading, error, reload } = useApi<ApiExpense[]>(() => endpoints.expenses(), []);
  const { data: vendors } = useApi<ApiParty[]>(() => endpoints.vendors(), []);
  const { data: categories } = useApi<ApiCategory[]>(() => endpoints.categories('expense'), []);
  const { show, toast } = useToast();
  const writable = canWrite();

  const vendorList = vendors ?? [];
  const categoryList = categories ?? [];
  const vendorName = useMemo(() => new Map(vendorList.map((v) => [v.id, v.business_name])), [vendorList]);
  const categoryName = useMemo(() => new Map(categoryList.map((c) => [c.id, c.name])), [categoryList]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiExpense | null>(null);
  const [form, setForm] = useState({ vendor_id: '', category_id: '', expense_date: today(), amount: '', gst_amount: '', payment_method: '', reference_number: '', description: '' });

  function openCreate() {
    setEditing(null);
    setForm({ vendor_id: '', category_id: '', expense_date: today(), amount: '', gst_amount: '', payment_method: '', reference_number: '', description: '' });
    setFormError(null);
    setOpen(true);
  }

  function openEdit(expense: ApiExpense) {
    setEditing(expense);
    setForm({
      vendor_id: expense.vendor_id ?? '',
      category_id: expense.category_id ?? '',
      expense_date: expense.expense_date,
      amount: String(num(expense.amount)),
      gst_amount: String(num(expense.gst_amount)),
      payment_method: expense.payment_method ?? '',
      reference_number: expense.reference_number ?? '',
      description: expense.description ?? '',
    });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      vendor_id: form.vendor_id || null,
      category_id: form.category_id || null,
      expense_date: form.expense_date,
      amount: Number(form.amount || 0),
      gst_amount: Number(form.gst_amount || 0),
      payment_method: form.payment_method || undefined,
      reference_number: form.reference_number || undefined,
      description: form.description || undefined,
    };
    try {
      if (editing) {
        await endpoints.updateExpense(editing.id, payload);
        show('success', 'Expense updated');
      } else {
        await endpoints.createExpense(payload);
        show('success', 'Expense recorded');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save expense');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: ApiExpense) {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await endpoints.deleteExpense(expense.id);
      show('success', 'Expense deleted');
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Capture vendor-linked expenses, GST paid, receipt attachments, and expense reports."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New Expense</Button> : undefined}
      />

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No expenses yet" hint={writable ? 'Record business expenses to track spend and input GST.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />New Expense</Button> : undefined} />
      ) : (
        <DataTable
          rows={list}
          getKey={(row) => row.id}
          columns={[
            { key: 'vendor', label: 'Vendor', render: (row) => <span className="font-semibold text-ink">{row.vendor_id ? vendorName.get(row.vendor_id) ?? '—' : '—'}</span> },
            { key: 'category', label: 'Category', render: (row) => (row.category_id ? categoryName.get(row.category_id) ?? '—' : '—') },
            { key: 'date', label: 'Date', render: (row) => formatDate(row.expense_date) },
            { key: 'description', label: 'Description', render: (row) => row.description ?? '—' },
            { key: 'gst', label: 'GST', align: 'right', render: (row) => currency.format(num(row.gst_amount)) },
            { key: 'amount', label: 'Amount', align: 'right', render: (row) => currency.format(num(row.amount)) },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button className="rounded border border-line p-2 text-slate hover:bg-surface disabled:opacity-40" aria-label="Edit" onClick={() => openEdit(row)} disabled={!writable}><Pencil size={15} /></button>
                  <button className="rounded border border-line p-2 text-rose hover:bg-rose/10 disabled:opacity-40" aria-label="Delete" onClick={() => handleDelete(row)} disabled={!writable}><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Expense' : 'New Expense'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="expense-form">{saving ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <form id="expense-form" className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Vendor">
              <select className="field" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
                <option value="">No vendor</option>
                {vendorList.map((v) => <option key={v.id} value={v.id}>{v.business_name}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select className="field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">No category</option>
                {categoryList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Date"><input className="field" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required /></Field>
            <Field label="Amount"><input className="field" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
            <Field label="GST Amount"><input className="field" type="number" step="0.01" value={form.gst_amount} onChange={(e) => setForm({ ...form, gst_amount: e.target.value })} /></Field>
            <Field label="Payment Method">
              <select className="field" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="">—</option>
                {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Reference Number"><input className="field" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea className="field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

/* ------------------------------- Documents ------------------------------ */

export function DocumentsPage() {
  const { data, loading, error, reload } = useApi<ApiDocument[]>(() => endpoints.documents(), []);
  const { show, toast } = useToast();
  const writable = canWrite();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('invoice');
  // tracks which row action is in-flight: { id, action } so we can show a spinner on that exact button
  const [busy, setBusy] = useState<{ id: string; action: 'extract' | 'reprocess' } | null>(null);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    try {
      await endpoints.uploadDocument(formData);
      show('success', `Uploaded ${file.name}`);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function runRow(id: string, action: 'extract' | 'reprocess', label: string, fn: () => Promise<unknown>) {
    setBusy({ id, action });
    try {
      const result = (await fn()) as { status?: string } | null;
      if (result?.status === 'failed') {
        show('danger', 'Extraction failed — the document could not be read.');
      } else {
        show('success', label);
      }
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(doc: ApiDocument) {
    if (!window.confirm(`Delete ${doc.file_name ?? 'this document'}?`)) return;
    try {
      await endpoints.deleteDocument(doc.id);
      show('success', 'Document deleted');
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="AI Document Center"
        description="Upload invoices, receipts, quotations, and vendor bills for AI-powered extraction into drafts."
      />
      <div className="mb-4 grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <p className="label mb-2">Document Type</p>
          <select className="field mb-3" value={docType} onChange={(e) => setDocType(e.target.value)} disabled={!writable}>
            <option value="invoice">Customer Invoice</option>
            <option value="bill">Vendor Bill</option>
            <option value="receipt">Expense Receipt</option>
            <option value="quotation">Quotation</option>
          </select>
          <label className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-line bg-surface px-4 py-6 text-center ${(!writable || uploading) ? 'pointer-events-none opacity-70' : ''}`}>
            {uploading ? <InlineSpinner className="h-6 w-6 text-ink" /> : <Upload className="text-muted" size={24} />}
            <p className="mt-2 text-sm font-semibold text-ink">{uploading ? 'Uploading…' : 'Click to upload'}</p>
            <p className="mt-1 text-xs text-muted">{uploading ? 'Please wait while we upload your file' : 'PDF, PNG, JPG up to 10 MB'}</p>
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} disabled={!writable || uploading} />
          </label>
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold">How it works</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Upload a PDF or image of an invoice, bill, or receipt.</li>
            <li>Run extraction to pull party, line items, GST, and totals.</li>
            <li>Review the result and create an invoice, expense, or vendor bill draft.</li>
          </ol>
        </Card>
      </div>

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No documents uploaded" hint="Upload a document above to start AI extraction." />
      ) : (
        <DataTable
          rows={list}
          getKey={(row) => row.id}
          columns={[
            {
              key: 'file',
              label: 'File Name',
              render: (row) =>
                row.file_url ? (
                  <a className="font-semibold text-ink underline decoration-line hover:text-sky" href={row.file_url} target="_blank" rel="noreferrer">
                    {row.file_name ?? 'View file'}
                  </a>
                ) : (
                  <span className="font-semibold text-ink">{row.file_name ?? '—'}</span>
                ),
            },
            { key: 'type', label: 'Type', render: (row) => <span className="capitalize">{row.document_type}</span> },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} tone={row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'} /> },
            { key: 'date', label: 'Uploaded', render: (row) => formatDateTime(row.created_at) },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => {
                const extracting = busy?.id === row.id && busy.action === 'extract';
                const reprocessing = busy?.id === row.id && busy.action === 'reprocess';
                const rowBusy = busy?.id === row.id;
                return writable ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="min-h-8 px-2 py-1 text-xs"
                      disabled={rowBusy}
                      onClick={() => runRow(row.id, 'extract', 'Extraction complete', () => endpoints.extractDocument(row.id))}
                    >
                      {extracting ? <><InlineSpinner className="h-3.5 w-3.5" />Extracting…</> : 'Extract'}
                    </Button>
                    <button
                      className="rounded border border-line p-2 text-slate hover:bg-surface disabled:opacity-40"
                      aria-label="Reprocess"
                      disabled={rowBusy}
                      onClick={() => runRow(row.id, 'reprocess', 'Reprocessing complete', () => endpoints.reprocessDocument(row.id))}
                    >
                      {reprocessing ? <InlineSpinner className="h-3.5 w-3.5" /> : <RefreshCw size={15} />}
                    </button>
                    <button
                      className="rounded border border-line p-2 text-rose hover:bg-rose/10 disabled:opacity-40"
                      aria-label="Delete"
                      disabled={rowBusy}
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : null;
              },
            },
          ]}
        />
      )}
      {toast}
    </>
  );
}

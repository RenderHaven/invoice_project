import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { endpoints } from '../api/endpoints';
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
  useToast,
} from '../components/ui';
import { currency } from '../lib/format';
import { getSessionUser } from '../lib/session';
import { useApi } from '../lib/useApi';
import type { ApiCategory, ApiItem, ApiParty, PartyInput } from '../types';

function canWrite() {
  const role = getSessionUser()?.role;
  return role === 'admin' || role === 'manager';
}

/* ------------------------------- Parties ------------------------------- */

type PartyFormState = {
  business_name: string;
  contact_person: string;
  gst_number: string;
  email: string;
  phone: string;
  notes: string;
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
};

const emptyParty: PartyFormState = {
  business_name: '',
  contact_person: '',
  gst_number: '',
  email: '',
  phone: '',
  notes: '',
  line1: '',
  city: '',
  state: '',
  postal_code: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
};

function partyToForm(party: ApiParty): PartyFormState {
  return {
    business_name: party.business_name ?? '',
    contact_person: party.contact_person ?? '',
    gst_number: party.gst_number ?? '',
    email: party.email ?? '',
    phone: party.phone ?? '',
    notes: party.notes ?? '',
    line1: party.address?.line1 ?? '',
    city: party.address?.city ?? '',
    state: party.address?.state ?? '',
    postal_code: party.address?.postal_code ?? '',
    bank_name: party.bank_account?.bank_name ?? '',
    account_number: party.bank_account?.account_number ?? '',
    ifsc_code: party.bank_account?.ifsc_code ?? '',
    upi_id: party.bank_account?.upi_id ?? '',
  };
}

function buildPartyPayload(form: PartyFormState, type: 'customer' | 'vendor'): PartyInput {
  const payload: PartyInput = {
    type,
    business_name: form.business_name.trim(),
    contact_person: form.contact_person || undefined,
    gst_number: form.gst_number || undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    notes: form.notes || undefined,
  };
  if (form.line1 || form.city || form.state || form.postal_code) {
    payload.address = { line1: form.line1, city: form.city, state: form.state, postal_code: form.postal_code };
  }
  if (form.bank_name || form.account_number || form.ifsc_code || form.upi_id) {
    payload.bank_account = {
      bank_name: form.bank_name,
      account_number: form.account_number,
      ifsc_code: form.ifsc_code,
      upi_id: form.upi_id,
    };
  }
  return payload;
}

function PartyPage({ kind }: { kind: 'customer' | 'vendor' }) {
  const isCustomer = kind === 'customer';
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useApi<ApiParty[]>(
    () => (isCustomer ? endpoints.customers(search) : endpoints.vendors(search)),
    [search, isCustomer],
  );
  const { show, toast } = useToast();
  const [editing, setEditing] = useState<ApiParty | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PartyFormState>(emptyParty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const writable = canWrite();

  function openCreate() {
    setEditing(null);
    setForm(emptyParty);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(party: ApiParty) {
    setEditing(party);
    setForm(partyToForm(party));
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = buildPartyPayload(form, kind);
    try {
      if (editing) {
        await (isCustomer ? endpoints.updateCustomer(editing.id, payload) : endpoints.updateVendor(editing.id, payload));
        show('success', `${isCustomer ? 'Customer' : 'Vendor'} updated`);
      } else {
        await (isCustomer ? endpoints.createCustomer(payload) : endpoints.createVendor(payload));
        show('success', `${isCustomer ? 'Customer' : 'Vendor'} created`);
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(party: ApiParty) {
    if (!window.confirm(`Delete ${party.business_name}?`)) return;
    try {
      await (isCustomer ? endpoints.deleteCustomer(party.id) : endpoints.deleteVendor(party.id));
      show('success', `Deleted ${party.business_name}`);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title={isCustomer ? 'Customers' : 'Vendors'}
        description={
          isCustomer
            ? 'Manage customer profiles, GST details, invoice history, and receivables.'
            : 'Track supplier records, vendor bills, GST details, and outstanding payables.'
        }
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New {isCustomer ? 'Customer' : 'Vendor'}</Button> : undefined}
      />
      <Card className="mb-4">
        <Field label="Search">
          <SearchInput value={search} onChange={setSearch} placeholder={`Search ${kind} name, email, phone...`} />
        </Field>
      </Card>

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${kind}s yet`}
          hint={writable ? `Create your first ${kind} to start billing.` : 'Nothing to display.'}
          action={writable ? <Button onClick={openCreate}><Plus size={16} />New {isCustomer ? 'Customer' : 'Vendor'}</Button> : undefined}
        />
      ) : (
        <DataTable
          rows={rows}
          getKey={(row) => row.id}
          columns={[
            { key: 'businessName', label: isCustomer ? 'Business' : 'Vendor', render: (row) => <span className="font-semibold text-ink">{row.business_name}</span> },
            { key: 'contact', label: 'Contact', render: (row) => [row.contact_person, row.phone].filter(Boolean).join(' · ') || '—' },
            { key: 'email', label: 'Email', render: (row) => row.email ?? '—' },
            { key: 'gst', label: 'GST Number', render: (row) => row.gst_number ?? '—' },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <button className="rounded border border-line p-2 text-slate hover:bg-surface disabled:opacity-40" aria-label="Edit" onClick={() => openEdit(row)} disabled={!writable}>
                    <Pencil size={15} />
                  </button>
                  <button className="rounded border border-line p-2 text-rose hover:bg-rose/10 disabled:opacity-40" aria-label="Delete" onClick={() => handleDelete(row)} disabled={!writable}>
                    <Trash2 size={15} />
                  </button>
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
        title={editing ? `Edit ${isCustomer ? 'Customer' : 'Vendor'}` : `New ${isCustomer ? 'Customer' : 'Vendor'}`}
        description="Profile, GST, contact, address, and bank details."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="party-form">{saving ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <form id="party-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Business Name"><input className="field" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required /></Field>
            <Field label="Contact Person"><input className="field" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
            <Field label="GST Number"><input className="field" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></Field>
            <Field label="Email"><input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <div>
            <p className="label mb-2">Address</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Line 1"><input className="field" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></Field>
              <Field label="City"><input className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="State"><input className="field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
              <Field label="Postal Code"><input className="field" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></Field>
            </div>
          </div>
          <div>
            <p className="label mb-2">Bank Details</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Bank Name"><input className="field" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
              <Field label="Account Number"><input className="field" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
              <Field label="IFSC Code"><input className="field" value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} /></Field>
              <Field label="UPI ID"><input className="field" value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} /></Field>
            </div>
          </div>
          {editing ? <p className="text-xs text-muted">Note: address &amp; bank details are saved when creating; updates persist the core profile fields.</p> : null}
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

export function CustomersPage() {
  return <PartyPage kind="customer" />;
}

export function VendorsPage() {
  return <PartyPage kind="vendor" />;
}

/* -------------------------------- Items -------------------------------- */

type ItemFormState = {
  type: 'product' | 'service';
  category_id: string;
  name: string;
  unit: string;
  sale_price: string;
  gst_rate: string;
  description: string;
};

const emptyItem: ItemFormState = {
  type: 'product',
  category_id: '',
  name: '',
  unit: '',
  sale_price: '',
  gst_rate: '',
  description: '',
};

export function ItemsPage() {
  const [typeFilter, setTypeFilter] = useState<'' | 'product' | 'service'>('');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useApi<ApiItem[]>(
    () => endpoints.items({ type: typeFilter || undefined, search: search || undefined }),
    [typeFilter, search],
  );
  const { data: categories } = useApi<ApiCategory[]>(() => endpoints.categories(), []);
  const { show, toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiItem | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const writable = canWrite();

  const categoryName = useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? '—' : '—');
  }, [categories]);

  function openCreate() {
    setEditing(null);
    setForm(emptyItem);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(item: ApiItem) {
    setEditing(item);
    setForm({
      type: (item.type as 'product' | 'service') ?? 'product',
      category_id: item.category_id ?? '',
      name: item.name,
      unit: item.unit ?? '',
      sale_price: item.sale_price ?? '',
      gst_rate: item.gst_rate ?? '',
      description: item.description ?? '',
    });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      type: form.type,
      category_id: form.category_id || null,
      name: form.name.trim(),
      unit: form.unit || undefined,
      sale_price: form.sale_price === '' ? undefined : form.sale_price,
      gst_rate: form.gst_rate === '' ? undefined : form.gst_rate,
      description: form.description || undefined,
    };
    try {
      if (editing) {
        await endpoints.updateItem(editing.id, payload);
        show('success', 'Item updated');
      } else {
        await endpoints.createItem(payload);
        show('success', 'Item created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ApiItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await endpoints.deleteItem(item.id);
      show('success', `Deleted ${item.name}`);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title="Products & Services"
        description="Maintain billable products, service catalog, pricing, units, categories, and GST rates."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New Item</Button> : undefined}
      />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <Field label="Search"><SearchInput value={search} onChange={setSearch} placeholder="Search item catalog..." /></Field>
        </Card>
        <Card>
          <p className="label mb-2">Filter</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {([['', 'All'], ['product', 'Products'], ['service', 'Services']] as const).map(([value, label]) => (
              <button
                key={label}
                onClick={() => setTypeFilter(value)}
                className={`rounded border px-3 py-2 font-semibold ${typeFilter === value ? 'border-ink bg-ink text-white' : 'border-line text-slate hover:bg-surface'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No items yet" hint={writable ? 'Add products and services to use them on invoices and quotations.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />New Item</Button> : undefined} />
      ) : (
        <DataTable
          rows={rows}
          getKey={(row) => row.id}
          columns={[
            { key: 'name', label: 'Item', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
            { key: 'type', label: 'Type', render: (row) => <StatusBadge label={row.type} tone={row.type === 'product' ? 'info' : 'success'} /> },
            { key: 'category', label: 'Category', render: (row) => categoryName(row.category_id) },
            { key: 'unit', label: 'Unit', render: (row) => row.unit ?? '—' },
            { key: 'gst', label: 'GST', align: 'right', render: (row) => `${Number(row.gst_rate ?? 0)}%` },
            { key: 'salePrice', label: 'Price', align: 'right', render: (row) => currency.format(Number(row.sale_price ?? 0)) },
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
        title={editing ? 'Edit Item' : 'New Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="item-form">{saving ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <form id="item-form" className="space-y-3" onSubmit={handleSubmit}>
          <Field label="Name"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Type">
              <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'product' | 'service' })}>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </Field>
            <Field label="Category">
              <select className="field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">No category</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </Field>
            <Field label="Unit"><input className="field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, hrs, kg" /></Field>
            <Field label="Sale Price"><input className="field" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></Field>
            <Field label="GST Rate (%)"><input className="field" type="number" step="0.01" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea className="field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

/* ------------------------------ Categories ----------------------------- */

export function CategoriesPage() {
  const { data, loading, error, reload } = useApi<ApiCategory[]>(() => endpoints.categories(), []);
  const { show, toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [form, setForm] = useState<{ type: 'product' | 'service' | 'expense'; name: string }>({ type: 'product', name: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const writable = canWrite();

  function openCreate() {
    setEditing(null);
    setForm({ type: 'product', name: '' });
    setFormError(null);
    setOpen(true);
  }

  function openEdit(category: ApiCategory) {
    setEditing(category);
    setForm({ type: (category.type as 'product' | 'service' | 'expense') ?? 'product', name: category.name });
    setFormError(null);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await endpoints.updateCategory(editing.id, form);
        show('success', 'Category updated');
      } else {
        await endpoints.createCategory(form);
        show('success', 'Category created');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: ApiCategory) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try {
      await endpoints.deleteCategory(category.id);
      show('success', `Deleted ${category.name}`);
      reload();
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not delete');
    }
  }

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title="Categories"
        description="Reusable buckets for item catalog and business expense reporting."
        actions={writable ? <Button onClick={openCreate}><Plus size={16} />New Category</Button> : undefined}
      />

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No categories yet" hint={writable ? 'Group products, services, and expenses for cleaner reporting.' : 'Nothing to display.'} action={writable ? <Button onClick={openCreate}><Plus size={16} />New Category</Button> : undefined} />
      ) : (
        <DataTable
          rows={rows}
          getKey={(row) => row.id}
          columns={[
            { key: 'name', label: 'Category', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
            { key: 'type', label: 'Type', render: (row) => <StatusBadge label={row.type} tone={row.type === 'expense' ? 'warning' : row.type === 'service' ? 'success' : 'info'} /> },
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
        title={editing ? 'Edit Category' : 'New Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="category-form">{saving ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <form id="category-form" className="space-y-3" onSubmit={handleSubmit}>
          <Field label="Name"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type">
            <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'product' | 'service' | 'expense' })}>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="expense">Expense</option>
            </select>
          </Field>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
        </form>
      </Modal>
      {toast}
    </>
  );
}

import { Plus, Search } from 'lucide-react';
import { Button, Card, DataTable, Field, PageHeader, StatusBadge } from '../components/ui';
import { categories, customers, items, vendors } from '../data/mockData';
import { currency } from '../lib/format';

export function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="Manage customer profiles, GST details, invoice history, and receivables." actions={<Button><Plus size={16} />New Customer</Button>} />
      <Card className="mb-4">
        <SearchFilter placeholder="Search customer name, GSTIN, email..." />
      </Card>
      <DataTable
        rows={customers}
        getKey={(row) => row.id}
        columns={[
          { key: 'businessName', label: 'Business', render: (row) => <span className="font-semibold text-ink">{row.businessName}</span> },
          { key: 'contact', label: 'Contact', render: (row) => `${row.contactPerson} · ${row.phone}` },
          { key: 'gst', label: 'GST Number', render: (row) => row.gstNumber },
          { key: 'invoices', label: 'Invoices', align: 'right', render: (row) => row.invoices },
          { key: 'outstanding', label: 'Outstanding', align: 'right', render: (row) => currency.format(row.outstanding) },
        ]}
      />
    </>
  );
}

export function VendorsPage() {
  return (
    <>
      <PageHeader title="Vendors" description="Track supplier records, vendor bills, GST details, and outstanding payables." actions={<Button><Plus size={16} />New Vendor</Button>} />
      <Card className="mb-4">
        <SearchFilter placeholder="Search vendor name, GSTIN, email..." />
      </Card>
      <DataTable
        rows={vendors}
        getKey={(row) => row.id}
        columns={[
          { key: 'businessName', label: 'Vendor', render: (row) => <span className="font-semibold text-ink">{row.businessName}</span> },
          { key: 'contact', label: 'Contact', render: (row) => `${row.contactPerson} · ${row.phone}` },
          { key: 'gst', label: 'GST Number', render: (row) => row.gstNumber },
          { key: 'expenses', label: 'Bills', align: 'right', render: (row) => row.expenses },
          { key: 'outstanding', label: 'Payable', align: 'right', render: (row) => currency.format(row.outstanding) },
        ]}
      />
    </>
  );
}

export function ItemsPage() {
  return (
    <>
      <PageHeader title="Products & Services" description="Maintain billable products, service catalog, pricing, units, categories, and GST rates." actions={<Button><Plus size={16} />New Item</Button>} />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <SearchFilter placeholder="Search item catalog..." />
        </Card>
        <Card>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {['All', 'Products', 'Services'].map((label) => (
              <button key={label} className="rounded border border-line px-3 py-2 font-semibold text-slate hover:bg-surface">{label}</button>
            ))}
          </div>
        </Card>
      </div>
      <DataTable
        rows={items}
        getKey={(row) => row.id}
        columns={[
          { key: 'name', label: 'Item', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
          { key: 'type', label: 'Type', render: (row) => <StatusBadge label={row.type} tone={row.type === 'Product' ? 'info' : 'success'} /> },
          { key: 'category', label: 'Category', render: (row) => row.category },
          { key: 'unit', label: 'Unit', render: (row) => row.unit },
          { key: 'gst', label: 'GST', align: 'right', render: (row) => `${row.gstRate}%` },
          { key: 'salePrice', label: 'Price', align: 'right', render: (row) => currency.format(row.salePrice) },
        ]}
      />
    </>
  );
}

export function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" description="Reusable buckets for item catalog and business expense reporting." actions={<Button><Plus size={16} />New Category</Button>} />
      <DataTable
        rows={categories}
        getKey={(row) => row.id}
        columns={[
          { key: 'name', label: 'Category', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
          { key: 'type', label: 'Type', render: (row) => <StatusBadge label={row.type} tone={row.type === 'Expense' ? 'warning' : 'info'} /> },
          { key: 'records', label: 'Records', align: 'right', render: (row) => row.records },
        ]}
      />
    </>
  );
}

function SearchFilter({ placeholder }: { placeholder: string }) {
  return (
    <Field label="Search">
      <div className="flex items-center gap-2 rounded border border-line bg-white px-3 py-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/20">
        <Search size={17} className="text-muted" />
        <input className="w-full bg-transparent text-sm outline-none" placeholder={placeholder} />
      </div>
    </Field>
  );
}

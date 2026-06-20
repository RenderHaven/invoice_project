import { Building2, Save } from 'lucide-react';
import { Button, Card, DataTable, Field, MetricCard, PageHeader, StatusBadge } from '../components/ui';
import { currency } from '../lib/format';

const gstRows = [
  { month: 'June 2026', collected: 75800, paid: 20980, liability: 54820 },
  { month: 'May 2026', collected: 68420, paid: 23600, liability: 44820 },
  { month: 'April 2026', collected: 59100, paid: 18120, liability: 40980 },
];

export function GstPage() {
  return (
    <>
      <PageHeader title="GST Overview" description="Monitor GST collected, GST paid, and net liability across filing periods." actions={<Button variant="secondary">Export GST Report</Button>} />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <MetricCard label="GST Collected" value={currency.format(75800)} helper="Output GST from invoices" tone="success" />
        <MetricCard label="GST Paid" value={currency.format(20980)} helper="Input GST from expenses" tone="info" />
        <MetricCard label="Net Liability" value={currency.format(54820)} helper="Projected payable" tone="warning" />
      </div>
      <DataTable
        rows={gstRows}
        getKey={(row) => row.month}
        columns={[
          { key: 'month', label: 'Month', render: (row) => <span className="font-semibold text-ink">{row.month}</span> },
          { key: 'collected', label: 'GST Collected', align: 'right', render: (row) => currency.format(row.collected) },
          { key: 'paid', label: 'GST Paid', align: 'right', render: (row) => currency.format(row.paid) },
          { key: 'liability', label: 'Liability', align: 'right', render: (row) => <StatusBadge label={currency.format(row.liability)} tone="warning" /> },
        ]}
      />
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure organization identity, GST details, invoice prefixes, terms, and bank accounts." actions={<Button><Save size={16} />Save Changes</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} />
            <h2 className="text-lg font-semibold">Organization Settings</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Organization Name"><input className="field" defaultValue="Demo Organization" /></Field>
            <Field label="GST Number"><input className="field" defaultValue="29AABCD1234F1Z5" /></Field>
            <Field label="Email"><input className="field" defaultValue="admin@example.com" /></Field>
            <Field label="Phone"><input className="field" defaultValue="+91 98765 43210" /></Field>
            <div className="md:col-span-2">
              <Field label="Address"><textarea className="field" rows={3} defaultValue="12 Finance Street, Bengaluru, Karnataka" /></Field>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Invoice Settings</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Invoice Prefix"><input className="field" defaultValue="INV-2026-" /></Field>
            <Field label="Quotation Prefix"><input className="field" defaultValue="QT-2026-" /></Field>
            <div className="md:col-span-2">
              <Field label="Invoice Notes"><textarea className="field" rows={3} defaultValue="Thank you for your business." /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Terms & Conditions"><textarea className="field" rows={4} defaultValue="Payment due within 15 days from invoice date." /></Field>
            </div>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Bank Accounts</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Bank Name"><input className="field" defaultValue="HDFC Bank" /></Field>
            <Field label="Account Number"><input className="field" defaultValue="50100234567891" /></Field>
            <Field label="IFSC Code"><input className="field" defaultValue="HDFC0001234" /></Field>
            <Field label="UPI ID"><input className="field" defaultValue="demo@hdfcbank" /></Field>
          </div>
        </Card>
      </div>
    </>
  );
}

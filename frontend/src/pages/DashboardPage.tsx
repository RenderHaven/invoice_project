import { ArrowDownRight, ArrowUpRight, Plus, ReceiptText } from 'lucide-react';
import { Button, Card, DataTable, MetricCard, PageHeader, Sparkline, StatusBadge } from '../components/ui';
import { customers, invoices, monthlyExpenses, monthlyRevenue } from '../data/mockData';
import { compactCurrency, currency } from '../lib/format';

export function DashboardPage() {
  const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const receivables = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const expenses = 63000;
  const gstLiability = 54820;

  return (
    <>
      <PageHeader
        title="Financial Dashboard"
        description="Cash flow, GST, receivables, invoice movement, and customer concentration in one operational view."
        actions={
          <>
            <Button variant="secondary">
              <ReceiptText size={16} />
              Export
            </Button>
            <Button>
              <Plus size={16} />
              New Invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={compactCurrency.format(revenue)} helper="+12.4% versus last month" tone="success" />
        <MetricCard label="Expenses" value={compactCurrency.format(expenses)} helper="Operating spend under control" tone="warning" />
        <MetricCard label="Profit" value={compactCurrency.format(revenue - expenses)} helper="Net position before tax" tone="success" />
        <MetricCard label="GST Liability" value={compactCurrency.format(gstLiability)} helper="Collected less paid GST" tone="info" />
        <MetricCard label="Receivables" value={compactCurrency.format(receivables)} helper="Open invoice balance" tone="danger" />
        <MetricCard label="Payables" value={compactCurrency.format(70500)} helper="Vendor obligations pending" tone="warning" />
        <MetricCard label="Invoices This Month" value="14" helper="3 overdue and 6 paid" tone="neutral" />
        <MetricCard label="Active Customers" value={String(customers.length)} helper="With invoice history" tone="info" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="label">Revenue trend</p>
              <h2 className="text-lg font-semibold">Monthly revenue</h2>
            </div>
            <StatusBadge label="monthly" tone="info" />
          </div>
          <Sparkline values={monthlyRevenue} color="#10b981" />
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <span className="rounded border border-line bg-surface p-3 text-muted">QTD {currency.format(1539000)}</span>
            <span className="rounded border border-line bg-surface p-3 text-muted">Avg {currency.format(413000)}</span>
            <span className="rounded border border-line bg-surface p-3 text-muted">Peak {currency.format(558000)}</span>
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="label">Expense trend</p>
              <h2 className="text-lg font-semibold">Monthly expenses</h2>
            </div>
            <StatusBadge label="stable" tone="warning" />
          </div>
          <Sparkline values={monthlyExpenses} color="#f59e0b" />
          <div className="mt-4 flex items-center justify-between rounded border border-line bg-surface p-3 text-sm">
            <span className="flex items-center gap-2 text-emerald">
              <ArrowDownRight size={16} /> Spend ratio improved
            </span>
            <span className="tabular font-semibold">31%</span>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent invoices</h2>
            <ArrowUpRight size={18} className="text-muted" />
          </div>
          <DataTable
            rows={invoices}
            getKey={(row) => row.id}
            columns={[
              { key: 'number', label: 'Invoice', render: (row) => <span className="font-semibold text-ink">{row.number}</span> },
              { key: 'customer', label: 'Customer', render: (row) => row.customer },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <StatusBadge
                    label={row.status}
                    tone={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'}
                  />
                ),
              },
              { key: 'total', label: 'Total', align: 'right', render: (row) => currency.format(row.total) },
            ]}
          />
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top customers</h2>
            <StatusBadge label="receivables" tone="info" />
          </div>
          <DataTable
            rows={customers}
            getKey={(row) => row.id}
            columns={[
              { key: 'businessName', label: 'Customer', render: (row) => <span className="font-semibold text-ink">{row.businessName}</span> },
              { key: 'contactPerson', label: 'Contact', render: (row) => row.contactPerson },
              { key: 'invoices', label: 'Invoices', align: 'right', render: (row) => row.invoices },
              { key: 'outstanding', label: 'Outstanding', align: 'right', render: (row) => currency.format(row.outstanding) },
            ]}
          />
        </Card>
      </div>
    </>
  );
}

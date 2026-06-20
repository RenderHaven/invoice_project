import { Plus, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { Alert, Button, Card, DataTable, MetricCard, PageHeader, Sparkline, Spinner, StatusBadge } from '../components/ui';
import { compactCurrency, currency } from '../lib/format';
import { useApi } from '../lib/useApi';
import type { DashboardSummary, InvoiceStatusSummary, TopCustomer, TrendPoint } from '../types';

function n(value: string | undefined) {
  return Number(value ?? 0);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary, loading, error } = useApi<DashboardSummary>(() => endpoints.dashboard(), []);
  const { data: status } = useApi<InvoiceStatusSummary>(() => endpoints.invoiceStatus(), []);
  const { data: topCustomers } = useApi<TopCustomer[]>(() => endpoints.topCustomers(), []);
  const { data: revenueTrend } = useApi<TrendPoint[]>(() => endpoints.revenueTrend('monthly'), []);
  const { data: expenseTrend } = useApi<TrendPoint[]>(() => endpoints.expenseTrend(), []);

  const revenueValues = (revenueTrend ?? []).map((p) => n(p.revenue));
  const expenseValues = (expenseTrend ?? []).map((p) => n(p.expenses));
  const statusEntries: Array<[string, number]> = status
    ? [
        ['draft', status.draft],
        ['sent', status.sent],
        ['paid', status.paid],
        ['overdue', status.overdue],
        ['cancelled', status.cancelled],
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Financial Dashboard"
        description="Cash flow, GST, receivables, invoice movement, and customer concentration in one operational view."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/gst')}>
              <ReceiptText size={16} />
              GST Report
            </Button>
            <Button onClick={() => navigate('/invoices')}>
              <Plus size={16} />
              New Invoice
            </Button>
          </>
        }
      />

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading || !summary ? (
        <Spinner label="Loading dashboard..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Revenue" value={compactCurrency.format(n(summary.total_revenue))} helper="Paid invoice totals" tone="success" />
            <MetricCard label="Expenses" value={compactCurrency.format(n(summary.total_expenses))} helper="Total recorded spend" tone="warning" />
            <MetricCard label="Profit" value={compactCurrency.format(n(summary.net_profit))} helper="Revenue less expenses" tone={n(summary.net_profit) >= 0 ? 'success' : 'danger'} />
            <MetricCard label="GST Liability" value={compactCurrency.format(n(summary.net_gst_liability))} helper="Collected less paid GST" tone="info" />
            <MetricCard label="Receivables" value={compactCurrency.format(n(summary.total_receivables))} helper="Open invoice balance" tone="danger" />
            <MetricCard label="Payables" value={compactCurrency.format(n(summary.total_payables))} helper="Vendor obligations pending" tone="warning" />
            <MetricCard label="GST Collected" value={compactCurrency.format(n(summary.gst_collected))} helper="Output GST on invoices" tone="info" />
            <MetricCard label="GST Paid" value={compactCurrency.format(n(summary.gst_paid))} helper="Input GST on expenses" tone="neutral" />
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
              <Sparkline values={revenueValues.length > 1 ? revenueValues : [0, ...revenueValues, 0]} color="#10b981" />
              {revenueValues.length === 0 ? <p className="mt-3 text-sm text-muted">No paid invoices yet — revenue trend will populate as invoices are paid.</p> : null}
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="label">Expense trend</p>
                  <h2 className="text-lg font-semibold">Monthly expenses</h2>
                </div>
                <StatusBadge label="stable" tone="warning" />
              </div>
              <Sparkline values={expenseValues.length > 1 ? expenseValues : [0, ...expenseValues, 0]} color="#f59e0b" />
              {expenseValues.length === 0 ? <p className="mt-3 text-sm text-muted">No expenses recorded yet.</p> : null}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Invoice status</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statusEntries.map(([label, count]) => (
                  <div key={label} className="rounded border border-line bg-surface p-3">
                    <p className="label capitalize">{label}</p>
                    <p className="tabular mt-2 text-2xl font-semibold text-ink">{count}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Top customers</h2>
                <StatusBadge label="by revenue" tone="info" />
              </div>
              {(topCustomers ?? []).length === 0 ? (
                <p className="rounded border border-dashed border-line bg-surface px-3 py-6 text-center text-sm text-muted">No paid invoices to rank customers yet.</p>
              ) : (
                <DataTable
                  rows={topCustomers ?? []}
                  getKey={(row) => row.customer_id}
                  columns={[
                    { key: 'name', label: 'Customer', render: (row) => <span className="font-semibold text-ink">{row.business_name}</span> },
                    { key: 'revenue', label: 'Revenue', align: 'right', render: (row) => currency.format(n(row.total_revenue)) },
                  ]}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

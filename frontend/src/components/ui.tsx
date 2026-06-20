import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { StatusTone } from '../types';

export function Button({
  children,
  variant = 'primary',
  className,
  type = 'button',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-9 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition',
        variant === 'primary' && 'bg-ink text-white hover:bg-slate',
        variant === 'secondary' && 'border border-line bg-white text-slate hover:bg-surface',
        variant === 'ghost' && 'text-slate hover:bg-surface',
        variant === 'danger' && 'bg-rose text-white hover:bg-rose/90',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="label mb-1">Finance workspace</p>
        <h1 className="text-2xl font-semibold tracking-normal text-ink md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        tone === 'neutral' && 'bg-slate-100 text-slate',
        tone === 'success' && 'bg-emerald/10 text-emerald',
        tone === 'warning' && 'bg-amber/10 text-amber',
        tone === 'danger' && 'bg-rose/10 text-rose',
        tone === 'info' && 'bg-sky/10 text-sky',
      )}
    >
      {label}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('panel p-4 md:p-5', className)}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  helper,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  helper: string;
  tone?: StatusTone;
}) {
  const dotClass = {
    neutral: 'bg-slate',
    success: 'bg-emerald',
    warning: 'bg-amber',
    danger: 'bg-rose',
    info: 'bg-sky',
  }[tone];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{label}</p>
          <p className="tabular mt-3 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full', dotClass)} />
      </div>
      <p className="mt-3 text-sm text-muted">{helper}</p>
    </Card>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
}: {
  columns: Array<{ key: string; label: string; render: (row: T) => ReactNode; align?: 'right' | 'left' }>;
  rows: T[];
  getKey: (row: T) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((row) => (
              <tr key={getKey(row)} className="hover:bg-surface">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx('whitespace-nowrap px-4 py-3 text-slate', column.align === 'right' && 'text-right tabular')}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line bg-white px-4 py-3 text-sm text-muted">
        <span>Page 1 of 1</span>
        <div className="flex gap-2">
          <Button variant="secondary" className="min-h-8 px-2 py-1 text-xs">
            Previous
          </Button>
          <Button variant="secondary" className="min-h-8 px-2 py-1 text-xs">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

export function Sparkline({ values, color = '#0f172a' }: { values: number[]; color?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 42 - ((value - min) / Math.max(max - min, 1)) * 34;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="h-24 w-full" viewBox="0 0 100 48" preserveAspectRatio="none" role="img" aria-label="Trend chart">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
      <polygon points={`0,48 ${points} 100,48`} fill={color} opacity="0.08" />
    </svg>
  );
}

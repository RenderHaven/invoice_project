import { clsx } from 'clsx';
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileScan,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  Tags,
  UserCog,
  Users,
  WalletCards,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getSessionUser } from '../lib/session';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Vendors', path: '/vendors', icon: Building2 },
  { label: 'Items', path: '/items', icon: Package },
  { label: 'Categories', path: '/categories', icon: Tags },
  { label: 'Quotations', path: '/quotations', icon: ReceiptText },
  { label: 'Invoices', path: '/invoices', icon: ReceiptText },
  { label: 'Payments', path: '/payments', icon: WalletCards },
  { label: 'Expenses', path: '/expenses', icon: Boxes },
  { label: 'GST', path: '/gst', icon: BarChart3 },
  { label: 'Documents', path: '/documents', icon: FileScan },
  { label: 'Users', path: '/users', icon: UserCog },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getSessionUser();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[280px] border-r border-line bg-white transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-line px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-ink text-white">
            <Building2 size={19} />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">FinCorp Ledger</p>
            <p className="label">Accounting Suite</p>
          </div>
        </div>
        <nav className="flex h-[calc(100%-4rem)] flex-col overflow-y-auto py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'relative mx-2 flex items-center gap-3 rounded px-4 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-surface text-ink before:absolute before:left-0 before:h-7 before:w-1 before:rounded-r before:bg-ink' : 'text-muted hover:bg-surface hover:text-ink',
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open ? <button aria-label="Close menu" className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="md:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded p-2 text-slate hover:bg-surface md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="hidden w-[420px] items-center gap-2 rounded border border-line bg-surface px-3 py-2 md:flex">
              <Search size={17} className="text-muted" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search customers, vendors, invoices..." />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded border border-line p-2 text-slate hover:bg-surface" aria-label="Collapse sidebar">
              <ChevronLeft size={18} className="hidden md:block" />
              <ChevronRight size={18} className="md:hidden" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name ?? 'Demo Organization'}</p>
              <p className="text-xs text-muted">{user ? `${user.email} · ${user.role}` : 'admin@example.com'}</p>
            </div>
            <button className="rounded border border-line p-2 text-slate hover:bg-surface" aria-label="Logout" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

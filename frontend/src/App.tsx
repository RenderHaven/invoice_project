import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { LoginPage, RegisterCompanyPage } from './pages/AuthPages';
import { CategoriesPage, CustomersPage, ItemsPage, VendorsPage } from './pages/DirectoryPages';
import { DashboardPage } from './pages/DashboardPage';
import { GstPage, SettingsPage } from './pages/GstSettingsPages';
import { DocumentsPage, ExpensesPage, InvoicesPage, PaymentsPage, QuotationsPage } from './pages/TransactionPages';
import { UserManagementPage } from './pages/UserManagementPage';
import { hasToken } from './lib/session';
import { Spinner } from './components/ui';
import { ServerOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export default function App() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'up' | 'down'>('checking');

  useEffect(() => {
    let isMounted = true;
    
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Server not OK');
        if (isMounted) setServerStatus('up');
      } catch (err) {
        if (isMounted) setServerStatus('down');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (serverStatus === 'checking') {
    return <div className="flex h-screen items-center justify-center bg-surface"><Spinner /></div>;
  }

  if (serverStatus === 'down') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose/10 text-rose">
             <ServerOff size={32} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Server Not Running</h1>
          <p className="text-slate">We cannot connect to the backend server. Please make sure the API is running and try again.</p>
          <div className="rounded bg-sky/10 p-3 text-sm text-sky">
            <p><strong>Note:</strong> If this is a free hosting tier, please wait for a few moments. The server may be waking up from sleep mode.</p>
          </div>
          <button className="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-colors" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterCompanyPage />} />
      <Route path="/" element={<Navigate to={hasToken() ? '/dashboard' : '/login'} replace />} />
      <Route
        path="/*"
        element={
          !hasToken() ? (
            <Navigate to="/login" replace />
          ) : (
          <AppLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="gst" element={<GstPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppLayout>
          )
        }
      />
    </Routes>
  );
}

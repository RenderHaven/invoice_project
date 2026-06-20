import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { LoginPage, RegisterCompanyPage } from './pages/AuthPages';
import { CategoriesPage, CustomersPage, ItemsPage, VendorsPage } from './pages/DirectoryPages';
import { DashboardPage } from './pages/DashboardPage';
import { GstPage, SettingsPage } from './pages/GstSettingsPages';
import { DocumentsPage, ExpensesPage, InvoicesPage, PaymentsPage, QuotationsPage } from './pages/TransactionPages';
import { UserManagementPage } from './pages/UserManagementPage';
import { hasToken } from './lib/session';

export default function App() {
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

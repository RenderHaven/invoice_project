import { KeyRound, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';
import { Button, Card, DataTable, Field, PageHeader, StatusBadge } from '../components/ui';
import { users as mockUsers } from '../data/mockData';
import { formatDate } from '../lib/format';
import { getSessionUser } from '../lib/session';
import type { User, UserRole } from '../types';

type Alert = { tone: 'success' | 'danger' | 'warning'; message: string } | null;

export function UserManagementPage() {
  const currentUser = getSessionUser();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<Alert>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Test@1234',
    role: 'other' as UserRole,
  });

  useEffect(() => {
    let active = true;

    endpoints
      .users()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((error) => {
        if (active) setAlert({ tone: 'warning', message: error instanceof Error ? error.message : 'Using sample users' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    try {
      const created = await endpoints.createUser(form);
      setUsers((existing) => [...existing, created]);
      setForm({ name: '', email: '', password: 'Test@1234', role: 'other' });
      setAlert({ tone: 'success', message: 'User created successfully' });
    } catch (error) {
      setAlert({ tone: 'danger', message: error instanceof Error ? error.message : 'Could not create user' });
    }
  }

  async function handleDelete(user: User) {
    try {
      await endpoints.deleteUser(user.id);
      setUsers((existing) => existing.filter((row) => row.id !== user.id));
      setAlert({ tone: 'success', message: `Deleted ${user.name}` });
    } catch (error) {
      setAlert({ tone: 'danger', message: error instanceof Error ? error.message : 'Could not delete user' });
    }
  }

  async function handleReset(user: User) {
    try {
      await endpoints.resetUserPassword(user.id, { new_password: 'NewTemp@1234' });
      setAlert({ tone: 'success', message: `Password reset for ${user.name}` });
    } catch (error) {
      setAlert({ tone: 'danger', message: error instanceof Error ? error.message : 'Could not reset password' });
    }
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Admin-only workspace for organization users, roles, password resets, and account removal."
        actions={
          <Button variant="secondary">
            <RefreshCw size={16} />
            {loading ? 'Loading...' : 'Synced'}
          </Button>
        }
      />

      {!isAdmin ? (
        <Card className="mb-4 border-amber/30 bg-amber/5">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 text-amber" size={20} />
            <div>
              <h2 className="font-semibold text-ink">Admin access required</h2>
              <p className="mt-1 text-sm text-muted">The backend restricts `/users` to admin role. Login with an admin account to create, delete, or reset users.</p>
            </div>
          </div>
        </Card>
      ) : null}

      {alert ? (
        <p className={`mb-4 rounded border px-3 py-2 text-sm ${alert.tone === 'success' ? 'border-emerald/20 bg-emerald/10 text-emerald' : alert.tone === 'warning' ? 'border-amber/20 bg-amber/10 text-amber' : 'border-rose/20 bg-rose/10 text-rose'}`}>
          {alert.message}
        </p>
      ) : null}

      <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <DataTable
            rows={users}
            getKey={(row) => row.id}
            columns={[
              { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-ink">{row.name}</span> },
              { key: 'email', label: 'Email', render: (row) => row.email },
              { key: 'role', label: 'Role', render: (row) => <StatusBadge label={row.role} tone={row.role === 'admin' ? 'danger' : row.role === 'manager' ? 'info' : 'neutral'} /> },
              { key: 'active', label: 'Status', render: (row) => <StatusBadge label={row.is_active ? 'Active' : 'Inactive'} tone={row.is_active ? 'success' : 'warning'} /> },
              { key: 'created', label: 'Created', render: (row) => formatDate(row.created_at) },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    <button className="rounded border border-line p-2 text-slate hover:bg-surface" aria-label="Reset password" onClick={() => handleReset(row)} disabled={!isAdmin}>
                      <KeyRound size={15} />
                    </button>
                    <button className="rounded border border-line p-2 text-rose hover:bg-rose/10" aria-label="Delete user" onClick={() => handleDelete(row)} disabled={!isAdmin}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Create User</h2>
          <form className="space-y-3" onSubmit={handleCreate}>
            <Field label="Name"><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
            <Field label="Email"><input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
            <Field label="Temporary Password"><input className="field" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></Field>
            <Field label="Role">
              <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Button className="w-full" type="submit">
              <Plus size={16} />
              Create User
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}

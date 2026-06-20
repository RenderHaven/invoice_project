import { Building2, LogIn, UserPlus } from 'lucide-react';
import { FormEvent, type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { Button, Field, StatusBadge } from '../components/ui';
import { saveSession } from '../lib/session';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@testcompay.com');
  const [password, setPassword] = useState('Test@1234');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'error'; message?: string }>({ type: 'idle' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ type: 'loading' });

    try {
      const payload = await endpoints.login({ email, password });
      saveSession(payload);
      navigate('/dashboard');
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Login failed' });
    }
  }

  return (
    <AuthShell
      title="Login"
      subtitle="Access your finance workspace with your organization account."
      footer={
        <>
          New company? <Link className="font-semibold text-ink underline" to="/register">Register company</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email"><input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        <Field label="Password"><input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
        {status.type === 'error' ? <p className="rounded border border-rose/20 bg-rose/10 px-3 py-2 text-sm text-rose">{status.message}</p> : null}
        <Button className="w-full" type="submit">
          <LogIn size={16} />
          {status.type === 'loading' ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    org_name: 'My Business Pvt Ltd',
    name: 'Vikram',
    email: 'vikram@mybusiness.com',
    password: 'Test@1234',
  });
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'error'; message?: string }>({ type: 'idle' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ type: 'loading' });

    try {
      const payload = await endpoints.register(form);
      saveSession(payload);
      navigate('/dashboard');
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Registration failed' });
    }
  }

  return (
    <AuthShell
      title="Register Company"
      subtitle="Create a company profile and the first admin account in one step."
      footer={
        <>
          Already registered? <Link className="font-semibold text-ink underline" to="/login">Login</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Company Name"><input className="field" value={form.org_name} onChange={(event) => setForm({ ...form, org_name: event.target.value })} required /></Field>
        <Field label="Admin Name"><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label="Admin Email"><input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
        <Field label="Password"><input className="field" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></Field>
        {status.type === 'error' ? <p className="rounded border border-rose/20 bg-rose/10 px-3 py-2 text-sm text-rose">{status.message}</p> : null}
        <Button className="w-full" type="submit">
          <UserPlus size={16} />
          {status.type === 'loading' ? 'Creating company...' : 'Create Company'}
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen bg-surface">
      <section className="hidden flex-1 border-r border-line bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-ink">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xl font-bold">RenderHaven</p>
            <p className="text-sm text-white/70">Accounting Suite</p>
          </div>
        </div>
        <div className="max-w-xl">
          <StatusBadge label="secure workspace" tone="info" />
          <h1 className="mt-5 text-4xl font-semibold tracking-normal">Billing, GST, expenses, and cash flow with role-based access.</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">Admins manage company settings and users. Managers operate financial workflows. Other users get read-only visibility.</p>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="label">Finance workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
          <p className="mt-5 text-center text-sm text-muted">{footer}</p>
        </div>
      </section>
    </main>
  );
}

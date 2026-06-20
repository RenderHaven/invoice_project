import { Building2, KeyRound, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';
import { Alert, Button, Card, Field, MetricCard, PageHeader, Spinner, useToast } from '../components/ui';
import { currency } from '../lib/format';
import { getSessionUser } from '../lib/session';
import { useApi } from '../lib/useApi';
import type { ApiOrganization, GstSummary } from '../types';

function nbr(value: string | undefined) {
  return Number(value ?? 0);
}

export function GstPage() {
  const { data, loading, error } = useApi<GstSummary>(() => endpoints.gst(), []);

  return (
    <>
      <PageHeader title="GST Overview" description="Monitor GST collected, GST paid, and net liability across filing periods." />
      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}
      {loading || !data ? (
        <Spinner label="Loading GST summary..." />
      ) : (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <MetricCard label="GST Collected" value={currency.format(nbr(data.gst_collected))} helper="Output GST from paid invoices" tone="success" />
            <MetricCard label="GST Paid" value={currency.format(nbr(data.gst_paid))} helper="Input GST from expenses" tone="info" />
            <MetricCard label="Net Liability" value={currency.format(nbr(data.net_gst_liability))} helper="Collected less paid" tone="warning" />
          </div>
          <Card>
            <p className="text-sm text-muted">
              Net GST liability is computed as GST collected on paid invoices minus GST paid on recorded expenses. Record
              invoices and expenses to populate these figures.
            </p>
          </Card>
        </>
      )}
    </>
  );
}

export function SettingsPage() {
  const isAdmin = getSessionUser()?.role === 'admin';
  const { data, loading, error } = useApi<ApiOrganization>(() => endpoints.organization(), []);
  const { show, toast } = useToast();

  const [form, setForm] = useState({ name: '', gst_number: '', email: '', phone: '', invoice_prefix: '', quotation_prefix: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name ?? '',
        gst_number: data.gst_number ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        invoice_prefix: data.invoice_prefix ?? '',
        quotation_prefix: data.quotation_prefix ?? '',
      });
    }
  }, [data]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await endpoints.updateOrganization(form);
      show('success', 'Organization settings saved');
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Configure organization identity, GST details, invoice prefixes, and your password." />

      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="xl:col-span-2">
            <form onSubmit={handleSave}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} />
                  <h2 className="text-lg font-semibold">Organization</h2>
                </div>
                {isAdmin ? <Button type="submit"><Save size={16} />{saving ? 'Saving...' : 'Save Changes'}</Button> : null}
              </div>
              {!isAdmin ? <div className="mb-4"><Alert tone="warning">Only admins can edit organization settings. Fields are read-only for your role.</Alert></div> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Organization Name"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isAdmin} /></Field>
                <Field label="GST Number"><input className="field" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} disabled={!isAdmin} /></Field>
                <Field label="Email"><input className="field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!isAdmin} /></Field>
                <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!isAdmin} /></Field>
                <Field label="Invoice Prefix"><input className="field" value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} disabled={!isAdmin} /></Field>
                <Field label="Quotation Prefix"><input className="field" value={form.quotation_prefix} onChange={(e) => setForm({ ...form, quotation_prefix: e.target.value })} disabled={!isAdmin} /></Field>
              </div>
            </form>
          </Card>

          <Card className="xl:col-span-2">
            <ChangePasswordForm />
          </Card>
        </div>
      )}
      {toast}
    </>
  );
}

function ChangePasswordForm() {
  const { show, toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await endpoints.changePassword({ current_password: current, new_password: next });
      show('success', 'Password changed');
      setCurrent('');
      setNext('');
    } catch (err) {
      show('danger', err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center gap-2">
        <KeyRound size={18} />
        <h2 className="text-lg font-semibold">Change Password</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Current Password"><input className="field" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></Field>
        <Field label="New Password"><input className="field" type="password" value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full">{saving ? 'Updating...' : 'Update Password'}</Button>
        </div>
      </div>
      {toast}
    </form>
  );
}

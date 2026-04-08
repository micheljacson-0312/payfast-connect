 'use client';

import { useEffect, useState } from 'react';

interface Application {
  id: number;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  ghl_location_id: string | null;
  pf_merchant_id: string | null;
  pf_merchant_key: string | null;
  pf_passphrase: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const input = { width: '100%', background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', color: '#0F172A', fontSize: 13, outline: 'none', fontFamily: 'inherit' } as const;

export default function AdminPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [list, setList] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/applications?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, [status, search]);

  function open(app: Application) {
    setSelected(app);
    setForm({
      status: app.status,
      pf_merchant_id: app.pf_merchant_id || '',
      pf_merchant_key: app.pf_merchant_key || '',
      pf_passphrase: app.pf_passphrase || '',
      admin_notes: app.admin_notes || '',
      rejection_reason: app.rejection_reason || '',
      reviewed_by: 'admin',
    });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/applications/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSelected(null);
      setForm(null);
      const refreshed = await fetch(`/api/admin/applications?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`).then((r) => r.json());
      setList(refreshed);
    }
    setSaving(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, color: '#0F172A' }}>Merchant Applications</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <select style={{ ...input, width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All Statuses</option><option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="live">Live</option></select>
            <input style={{ ...input, width: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications" />
            <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }} style={{ background: '#0F172A', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1.4fr 1.4fr 1fr 1fr 160px', gap: 12, padding: '14px 18px', background: '#F8FAFC', fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
            <div>ID</div><div>Applicant</div><div>Business</div><div>Phone</div><div>CRM Location</div><div>Status</div>
          </div>
          {loading ? <div style={{ padding: 28 }}>Loading…</div> : list.map((app) => (
            <button key={app.id} onClick={() => open(app)} style={{ width: '100%', textAlign: 'left', display: 'grid', gridTemplateColumns: '80px 1.4fr 1.4fr 1fr 1fr 160px', gap: 12, padding: '16px 18px', background: 'white', border: 'none', borderTop: '1px solid #F1F5F9', cursor: 'pointer' }}>
              <div>#{app.id}</div><div><div style={{ fontWeight: 700 }}>{app.full_name}</div><div style={{ color: '#64748B', fontSize: 12 }}>{app.email}</div></div><div>{app.business_name}</div><div>{app.phone}</div><div>{app.ghl_location_id || '—'}</div><div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{app.status}</div>
            </button>
          ))}
        </div>
      </div>

      {selected && form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 760, background: 'white', borderRadius: 20, padding: 24, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}><h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24 }}>Application #{selected.id}</h2><button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label>Status</label><select style={input} value={form.status} onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}><option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="live">Live</option></select></div>
              <div><label>Reviewed By</label><input style={input} value={form.reviewed_by} onChange={(e) => setForm((f: any) => ({ ...f, reviewed_by: e.target.value }))} /></div>
              <div><label>Store ID</label><input style={input} value={form.pf_merchant_id} onChange={(e) => setForm((f: any) => ({ ...f, pf_merchant_id: e.target.value }))} /></div>
              <div><label>Store Password</label><input style={input} value={form.pf_merchant_key} onChange={(e) => setForm((f: any) => ({ ...f, pf_merchant_key: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label>Passphrase</label><input style={input} value={form.pf_passphrase} onChange={(e) => setForm((f: any) => ({ ...f, pf_passphrase: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label>Admin Notes</label><textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={form.admin_notes} onChange={(e) => setForm((f: any) => ({ ...f, admin_notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label>Rejection Reason</label><textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} value={form.rejection_reason} onChange={(e) => setForm((f: any) => ({ ...f, rejection_reason: e.target.value }))} /></div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ background: '#E2E8F0', color: '#0F172A', border: 'none', padding: '12px 16px', borderRadius: 10, cursor: 'pointer' }}>Close</button>
              <button onClick={save} disabled={saving} style={{ background: '#0052FF', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

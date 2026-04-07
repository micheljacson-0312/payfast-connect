'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

type PayType = 'one-time' | 'subscription';
const FREQ = [{ val: '3', label: 'Monthly' }, { val: '4', label: 'Quarterly' }, { val: '6', label: 'Annual' }];

export default function NewPaymentPage() {
  const [type,      setType]      = useState<PayType>('one-time');
  const [form,      setForm]      = useState({ amount: '', itemName: '', itemDescription: '', email: '', firstName: '', lastName: '', contactId: '', frequency: '3', cycles: '0' });
  const [loading,   setLoading]   = useState(false);
  const [payFields, setPayFields] = useState<{ actionUrl: string; fields: Record<string, string> } | null>(null);
  const [error,     setError]     = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/payfast/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setPayFields(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inp = (style?: object) => ({
    width: '100%', background: 'var(--dark3)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '11px 16px', color: 'white', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', ...style,
  });
  const lbl = { fontSize: 13, color: 'var(--gray)', marginBottom: 8, display: 'block' as const };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/payments" style={{ color: 'var(--gray)', fontSize: 14 }}>← Payments</Link>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>New Payment Link</h2>
        </div>

        <div style={{ padding: '32px', maxWidth: 600 }}>
          {!payFields ? (
            <form onSubmit={generate}>
              {/* Type Toggle */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--dark2)', border: '1px solid var(--border)', padding: 4, borderRadius: 10, marginBottom: 28, width: 'fit-content' }}>
                {(['one-time', 'subscription'] as PayType[]).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    style={{ padding: '8px 20px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: type === t ? 'var(--blue)' : 'transparent', color: type === t ? 'white' : 'var(--gray)' }}>
                    {t === 'one-time' ? '💳 One-Time' : '🔄 Subscription'}
                  </button>
                ))}
              </div>

              {/* Amount + Item */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Amount (ZAR) *</label>
                  <input required style={inp()} placeholder="e.g. 299.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Item Name *</label>
                  <input required style={inp()} placeholder="e.g. Monthly Plan" value={form.itemName} onChange={e => set('itemName', e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Description (optional)</label>
                <input style={inp()} placeholder="What are they paying for?" value={form.itemDescription} onChange={e => set('itemDescription', e.target.value)} />
              </div>

              {/* Subscription options */}
              {type === 'subscription' && (
                <div style={{ background: 'var(--dark3)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Subscription Settings</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={lbl}>Billing Frequency</label>
                      <select style={inp({ cursor: 'pointer', appearance: 'none' }) as object} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                        {FREQ.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Cycles (0 = infinite)</label>
                      <input style={inp()} type="number" min="0" value={form.cycles} onChange={e => set('cycles', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0 20px' }} />

              {/* Payer info */}
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: 'var(--gray)' }}>Payer Details (optional — pre-fills GoPayFast form)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>First Name</label>
                  <input style={inp()} value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Last Name</label>
                  <input style={inp()} value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Email</label>
                <input style={inp()} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={lbl}>CRM Contact ID (optional)</label>
                <input style={inp()} placeholder="Paste CRM contact ID to auto-sync" value={form.contactId} onChange={e => set('contactId', e.target.value)} />
                <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6 }}>If left blank, contact will be found/created by email after payment.</div>
              </div>

              {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 20 }}>{error}</div>}

              <button type="submit" disabled={loading}
                style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '13px 32px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Generating...' : '⚡ Generate Payment Link'}
              </button>
            </form>
          ) : (
            /* Show the payment form to redirect/submit */
            <div>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>✅ Payment form ready!</div>
                <div style={{ fontSize: 13, color: 'var(--gray)' }}>Click the button below to redirect to GoPayFast checkout.</div>
              </div>

              <form action={payFields.actionUrl} method="POST">
                {Object.entries(payFields.fields).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <button type="submit"
                  style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginRight: 12 }}>
                  → Proceed to GoPayFast
                </button>
                <button type="button" onClick={() => setPayFields(null)}
                  style={{ background: 'var(--dark3)', color: 'var(--gray)', border: '1px solid var(--border)', padding: '14px 24px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                  ← Back
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

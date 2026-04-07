'use client';
import { useState, useEffect } from 'react';

// CRM loads this page in an iframe when user clicks "Manage Integration"
// in Payments > Integrations section of the CRM
// We use SSO token from URL to identify the location

export default function GHLConfigPage() {
  const [form, setForm] = useState({
    merchant_id:  '',
    merchant_key: '',
    passphrase:   '',
    environment:  'live',
  });
  const [locationId, setLocationId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [fetching,   setFetching]   = useState(true);

  useEffect(() => {
    // CRM passes ssoToken in URL params
    const params  = new URLSearchParams(window.location.search);
    const ssoToken = params.get('ssoToken') || params.get('token') || '';
    const locId    = params.get('locationId') || '';

    if (locId) setLocationId(locId);

    // Fetch existing config
    async function loadConfig() {
      try {
        const res = await fetch(`/api/ghl/config?locationId=${locId}&ssoToken=${ssoToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data.merchant_id) setForm(f => ({ ...f, ...data }));
        }
      } catch { /* first time — no config yet */ }
      setFetching(false);
    }

    if (locId) loadConfig();
    else setFetching(false);

    // Notify CRM page is ready
    window.parent.postMessage({ type: 'config-ready' }, '*');
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 15px', color: '#0F172A', fontSize: 14, outline: 'none', fontFamily: 'inherit' } as const;

  async function save() {
    if (!form.merchant_id.trim() || !form.merchant_key.trim()) {
      setError('Store ID and Store Password are required');
      return;
    }
    setLoading(true); setError('');
    try {
      const params   = new URLSearchParams(window.location.search);
      const ssoToken = params.get('ssoToken') || params.get('token') || '';
      const res = await fetch('/api/ghl/config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locationId, ssoToken }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Tell CRM config is saved
      window.parent.postMessage({ type: 'config-saved', success: true }, '*');
    } catch {
      setError('Failed to save. Please try again.');
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', background: 'white', display: 'grid', placeItems: 'center', fontFamily: 'DM Sans, sans-serif', color: '#64748B', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'DM Sans, sans-serif', padding: '24px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, background: '#0052FF', borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 13H11L10 22L19.5 11H13Z"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#0F172A' }}>GoPayFast Configuration</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>by 10x Digital Ventures</div>
        </div>
      </div>

      {/* Status */}
      {form.merchant_id && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#22C55E' }}>
          <span style={{ width: 7, height: 7, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />
          GoPayFast Connected · {form.environment === 'live' ? 'Live Mode' : 'Sandbox Mode'}
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Store ID <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input style={inp} value={form.merchant_id} onChange={e => set('merchant_id', e.target.value)} placeholder="e.g. 10012345" />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Enter your GoPayFast `store_id` here.</div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Store Password <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input style={inp} value={form.merchant_key} onChange={e => set('merchant_key', e.target.value)} placeholder="Your store password" />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Passphrase <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
          </label>
          <input style={inp} type="password" value={form.passphrase} onChange={e => set('passphrase', e.target.value)} placeholder="Leave blank if not set" />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 8, display: 'block', fontWeight: 500 }}>Mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['live', '🟢 Live'], ['sandbox', '🟡 Sandbox']].map(([v, l]) => (
              <button key={v} onClick={() => set('environment', v)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', background: form.environment === v ? '#EFF6FF' : 'transparent', color: form.environment === v ? '#0052FF' : '#64748B', borderColor: form.environment === v ? '#BFDBFE' : '#E2E8F0' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginTop: 20, fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
        <strong style={{ color: '#0F172A' }}>Setup:</strong> After saving, add this ITN (webhook) URL in your GoPayFast dashboard.
        <div style={{ background: '#EFF6FF', borderRadius: 7, padding: '7px 10px', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: '#0052FF', wordBreak: 'break-all' }}>
          {typeof window !== 'undefined' ? window.location.origin : ''}/api/payfast/itn
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#EF4444', marginTop: 14 }}>{error}</div>}
      {saved && <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#22C55E', marginTop: 14 }}>✅ Settings saved successfully!</div>}

      <button onClick={save} disabled={loading} style={{ width: '100%', background: '#0052FF', color: 'white', border: 'none', padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 18, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  );
}

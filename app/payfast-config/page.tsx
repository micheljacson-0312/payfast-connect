'use client';
import { useEffect, useRef, useState } from 'react';

// HighLevel Custom Page (loaded in iframe under Payments → Integrations → Manage,
// and also under My Apps → PayFast Settings).
//
// To resolve `locationId`, we use three strategies in order:
//   1. URL query param ?locationId=...  (most reliable when GHL passes it)
//   2. postMessage REQUEST_USER_DATA flow (official, per GHL docs)
//   3. URL query param ?ssoToken=...    (legacy fallback)
//
// After locationId is known, we GET existing config and pre-fill the form.

export default function PayfastConfigPage() {
  const [form, setForm] = useState({
    merchant_id:   '',
    merchant_name: '',
    store_id:      '',
    merchant_key:  '',
    passphrase:    '',
    environment:   'live',
  });
  const [locationId, setLocationId] = useState('');
  const [companyId,  setCompanyId]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [fetching,   setFetching]   = useState(true);
  const locRef = useRef<string>('');

  // ===== bootstrap: resolve locationId =====
  useEffect(() => {
    let mounted = true;

    async function loadExistingConfig(locId: string) {
      try {
        const res = await fetch(`/api/ghl/config?locationId=${encodeURIComponent(locId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if ((data.merchant_id || data.store_id) && mounted) {
          setForm(f => ({ ...f, ...data }));
        }
      } catch { /* no existing config */ }
    }

    function setLoc(loc: string, company?: string) {
      if (!loc || locRef.current) return;
      locRef.current = loc;
      if (mounted) {
        setLocationId(loc);
        if (company) setCompanyId(company);
      }
      loadExistingConfig(loc).finally(() => mounted && setFetching(false));
    }

    async function decryptSso(encryptedData: string) {
      try {
        const res = await fetch('/api/sso/decode', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ encryptedData }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    // --- Strategy 1: URL query param (most reliable) ---
    const params = new URLSearchParams(window.location.search);
    const urlLoc = params.get('locationId') || params.get('location_id') || '';
    if (urlLoc) {
      setLoc(urlLoc);
    }

    // --- Strategy 2: postMessage REQUEST_USER_DATA (official) ---
    function handleParentMessage(e: MessageEvent) {
      const d: any = e.data;
      if (!d || typeof d !== 'object') return;

      // Official GHL flow:
      // GHL replies with { message: 'REQUEST_USER_DATA_RESPONSE', payload: <encrypted> }
      if (d.message === 'REQUEST_USER_DATA_RESPONSE' && typeof d.payload === 'string') {
        decryptSso(d.payload).then(decoded => {
          if (decoded?.locationId && !locRef.current) {
            setLoc(decoded.locationId, decoded.companyId || undefined);
          }
        });
        return;
      }

      // Fallback shapes some GHL versions use:
      const candidateLoc =
        d.locationId || d.location_id ||
        d.payload?.locationId || d.payload?.location_id ||
        d.activeLocation;
      if (candidateLoc && typeof candidateLoc === 'string' && !locRef.current) {
        setLoc(candidateLoc, d.companyId || d.payload?.companyId);
      }

      const candidateToken =
        d.ssoToken || d.token ||
        d.payload?.ssoToken || d.payload?.token;
      if (candidateToken && typeof candidateToken === 'string' && !locRef.current) {
        decryptSso(candidateToken).then(decoded => {
          if (decoded?.locationId && !locRef.current) {
            setLoc(decoded.locationId, decoded.companyId || undefined);
          }
        });
      }
    }
    window.addEventListener('message', handleParentMessage);

    // Ask the parent for user data (per official GHL docs).
    setTimeout(() => {
      try {
        window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');
      } catch { /* not in iframe */ }
    }, 50);

    // --- Strategy 3: legacy ?ssoToken / ?token URL param ---
    const urlToken = params.get('ssoToken') || params.get('token') || '';
    if (urlToken && !locRef.current) {
      decryptSso(urlToken).then(decoded => {
        if (decoded?.locationId && !locRef.current) {
          setLoc(decoded.locationId, decoded.companyId || undefined);
        }
      });
    }

    // Stop the spinner after 5s even if nothing resolves, so user sees the form.
    const t = setTimeout(() => { if (mounted) setFetching(false); }, 5000);

    return () => {
      mounted = false;
      window.removeEventListener('message', handleParentMessage);
      clearTimeout(t);
    };
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp = {
    width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0',
    borderRadius: 10, padding: '11px 15px', color: '#0F172A', fontSize: 14,
    outline: 'none', fontFamily: 'inherit',
  } as const;

  async function save() {
    if (!locationId) {
      setError(
        'Location not detected. Please open this page from inside HighLevel ' +
        '(Payments → Integrations → Payfast Connect → Manage), not as a direct URL.'
      );
      return;
    }
    if (!form.merchant_id.trim() || !form.merchant_key.trim()) {
      setError('Merchant ID and Merchant Secured Key are required');
      return;
    }

    setLoading(true); setError('');

    try {
      const res = await fetch('/api/ghl/config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locationId, companyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Save failed (${res.status})`);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      try {
        window.parent.postMessage({ type: 'config-saved', success: true }, '*');
      } catch { /* ignore */ }
    } catch (err: any) {
      setError(err?.message || 'Failed to save. Please try again.');
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="page-shell-light" style={{ display: 'grid', placeItems: 'center', fontFamily: 'DM Sans, sans-serif', color: '#64748B', fontSize: 14, padding: 20, minHeight: 240 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Loading configuration…
        </div>
      </div>
    );
  }

  const isConfigured = !!(form.merchant_id && form.merchant_key);

  return (
    <div className="page-shell-light" style={{ padding: '24px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, background: '#0052FF', borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 13H11L10 22L19.5 11H13Z"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: '#0F172A' }}>GoPayFast Configuration</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>by 10x Digital Ventures</div>
        </div>
      </div>

      {!locationId && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>
          <strong>⚠ Location not detected.</strong> Open this page from inside HighLevel:<br />
          <strong>Payments → Integrations → Payfast Connect → Manage</strong>
        </div>
      )}

      {locationId && isConfigured && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#22C55E' }}>
          <span style={{ width: 7, height: 7, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />
          GoPayFast Connected · {form.environment === 'live' ? 'Live Mode' : 'Sandbox Mode'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Merchant ID <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input style={inp} value={form.merchant_id} onChange={e => set('merchant_id', e.target.value)} placeholder="e.g. 26290" />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Your numeric PayFast Merchant ID.</div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Merchant Name
          </label>
          <input style={inp} value={form.merchant_name} onChange={e => set('merchant_name', e.target.value)} placeholder="e.g. Mentoring Hub" />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Your registered business / merchant display name.</div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Store ID <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
          </label>
          <input style={inp} value={form.store_id} onChange={e => set('store_id', e.target.value)} placeholder="e.g. 10012345" />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Leave blank if you only use Merchant ID.</div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Merchant Secured Key <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input style={inp} type="password" value={form.merchant_key} onChange={e => set('merchant_key', e.target.value)} placeholder="Your secured key" />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 500 }}>
            Merchant Secret Word <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
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

      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginTop: 20, fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
        <strong style={{ color: '#0F172A' }}>Setup:</strong> After saving, add this ITN (webhook) URL in your GoPayFast dashboard.
        <div style={{ background: '#EFF6FF', borderRadius: 7, padding: '7px 10px', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: '#0052FF', wordBreak: 'break-all' }}>
          {typeof window !== 'undefined' ? window.location.origin : ''}/api/payfast/itn
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#EF4444', marginTop: 14 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#22C55E', marginTop: 14 }}>
          ✅ Settings saved successfully!
        </div>
      )}

      <button onClick={save} disabled={loading || !locationId} style={{ width: '100%', background: locationId ? '#0052FF' : '#94A3B8', color: 'white', border: 'none', padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: locationId ? 'pointer' : 'not-allowed', marginTop: 18, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  );
}
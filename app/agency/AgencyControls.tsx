'use client';

import { useState } from 'react';

export default function AgencyControls() {
  const [plans, setPlans] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [locationId, setLocationId] = useState('');
  const [message, setMessage] = useState('');
  const [payload, setPayload] = useState('{\n  "locationIds": [],\n  "rebillingType": "monthly",\n  "amount": 0\n}');
  const [enablePayload, setEnablePayload] = useState('{\n  "planId": "",\n  "subscriptionId": ""\n}');
  const [updatePayload, setUpdatePayload] = useState('{\n  "subscriptionId": "",\n  "amount": 0\n}');

  async function run(url: string, options?: RequestInit) {
    setMessage('');
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || data.message || 'Request failed');
      return null;
    }
    setMessage('Request completed successfully');
    return data;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Agency SaaS Plans</div>
          <button onClick={async () => setPlans(await run('/api/agency/saas/agency-plans'))} style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 14 }}>Load Agency Plans</button>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#9FB0D5', fontSize: 12 }}>{plans ? JSON.stringify(plans, null, 2) : 'Agency SaaS plans will appear here.'}</pre>
        </div>

        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Location Subscription</div>
          <input value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="Location ID" style={{ width: '100%', background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', marginBottom: 10 }} />
          <button onClick={async () => setSubscription(await run(`/api/agency/saas/location-subscription?locationId=${encodeURIComponent(locationId)}`))} style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 14 }}>Fetch Subscription</button>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#9FB0D5', fontSize: 12 }}>{subscription ? JSON.stringify(subscription, null, 2) : 'Subscription details will appear here.'}</pre>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Update Rebilling</div>
          <textarea value={payload} onChange={(e) => setPayload(e.target.value)} style={{ width: '100%', minHeight: 170, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', fontFamily: 'monospace' }} />
          <button onClick={() => run('/api/agency/saas/rebilling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })} style={{ marginTop: 12, background: 'var(--blue)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Send Rebilling Request</button>
        </div>

        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Enable SaaS Location</div>
          <input value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="Location ID" style={{ width: '100%', background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', marginBottom: 10 }} />
          <textarea value={enablePayload} onChange={(e) => setEnablePayload(e.target.value)} style={{ width: '100%', minHeight: 120, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', fontFamily: 'monospace' }} />
          <button onClick={() => run('/api/agency/saas/enable-location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId, payload: JSON.parse(enablePayload) }) })} style={{ marginTop: 12, background: 'var(--blue)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Enable SaaS</button>
        </div>

        <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Update / Pause SaaS</div>
          <input value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="Location ID" style={{ width: '100%', background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', marginBottom: 10 }} />
          <textarea value={updatePayload} onChange={(e) => setUpdatePayload(e.target.value)} style={{ width: '100%', minHeight: 120, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => run('/api/agency/saas/update-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId, payload: JSON.parse(updatePayload) }) })} style={{ flex: 1, background: 'var(--blue)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Update Subscription</button>
            <button onClick={() => run('/api/agency/saas/pause-location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId, payload: {} }) })} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Pause</button>
          </div>
        </div>
      </div>

      {message && <div style={{ background: 'rgba(0,82,255,0.08)', border: '1px solid rgba(0,82,255,0.2)', borderRadius: 10, padding: '12px 16px', color: '#3D7FFF' }}>{message}</div>}
    </div>
  );
}

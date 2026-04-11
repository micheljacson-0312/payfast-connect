'use client';
import { useEffect, useState } from 'react';

// CRM loads this page in an iframe when customer is checking out
// CRM passes: amount, currency, contactId, locationId, invoiceId etc via postMessage or URL params

interface GHLPaymentData {
  amount:        number;
  currency:      string;
  contactId:     string;
  locationId:    string;
  invoiceId?:    string;
  orderId?:      string;
  ghlTransactionId: string;
  description?:  string;
  contact?: {
    name:  string;
    email: string;
    phone: string;
  };
}

export default function GHLCheckoutPage() {
  const [payData,  setPayData]  = useState<GHLPaymentData | null>(null);
  const [form,     setForm]     = useState({ name:'', email:'', phone:'' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [pfForm,   setPfForm]   = useState<{ actionUrl:string; fields:Record<string,string> } | null>(null);

  // CRM sends payment data via postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Accept messages from CRM domains
      if (!event.origin.includes('gohighlevel') && !event.origin.includes('leadconnectorhq') && !event.origin.includes('localhost')) return;

      const d = event.data;
      if (d?.type === 'payment-init' || d?.amount) {
        setPayData(d);
        if (d.contact) {
          setForm({
            name:  d.contact.name  || '',
            email: d.contact.email || '',
            phone: d.contact.phone || '',
          });
        }
      }
    }

    window.addEventListener('message', handleMessage);

    // Also try URL params (CRM sometimes passes via query string)
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Partial<GHLPaymentData> = {};
    if (params.get('amount'))           fromUrl.amount = parseFloat(params.get('amount')!);
    if (params.get('currency'))         fromUrl.currency = params.get('currency')!;
    if (params.get('locationId'))       fromUrl.locationId = params.get('locationId')!;
    if (params.get('contactId'))        fromUrl.contactId = params.get('contactId')!;
    if (params.get('ghlTransactionId')) fromUrl.ghlTransactionId = params.get('ghlTransactionId')!;
    if (params.get('invoiceId'))        fromUrl.invoiceId = params.get('invoiceId')!;
    if (params.get('description'))      fromUrl.description = params.get('description')!;
    if (fromUrl.amount && fromUrl.locationId) {
      setPayData(fromUrl as GHLPaymentData);
    }

    // Tell CRM the iframe is ready
    window.parent.postMessage({ type: 'payment-ready' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-submit GoPayFast form after generation
  useEffect(() => {
    if (pfForm) {
      const frm = document.getElementById('pfSubmitForm') as HTMLFormElement;
      if (frm) setTimeout(() => frm.submit(), 500);
    }
  }, [pfForm]);

  async function pay() {
    if (!payData) return;
    if (!form.email.includes('@')) { setError('Valid email required'); return; }
    if (!form.name.trim())         { setError('Name required'); return; }

    setLoading(true); setError('');

    try {
      const res = await fetch('/api/ghl/pay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId:       payData.locationId,
          contactId:        payData.contactId,
          ghlTransactionId: payData.ghlTransactionId,
          invoiceId:        payData.invoiceId,
          orderId:          payData.orderId,
          amount:           payData.amount,
          currency:         payData.currency,
          description:      payData.description || 'CRM Payment',
          nameFirst:        form.name.split(' ')[0],
          nameLast:         form.name.split(' ').slice(1).join(' ') || '.',
          email:            form.email,
          phone:            form.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');

      // Tell CRM we're redirecting
      window.parent.postMessage({ type: 'payment-processing', ghlTransactionId: payData.ghlTransactionId }, '*');

      setPfForm(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setLoading(false);
    }
  }

  const inp = {
    width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0',
    borderRadius: 10, padding: '12px 16px', color: '#0F172A', fontSize: 14,
    outline: 'none', fontFamily: 'inherit',
  } as const;

  // GoPayFast redirect form
  if (pfForm) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#0F172A' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#64748B', fontSize: 14 }}>Redirecting to GoPayFast secure checkout…</p>
          <form id="pfSubmitForm" action={pfForm.actionUrl} method="POST">
            {Object.entries(pfForm.fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>
        </div>
      </div>
    );
  }

  // Loading state — waiting for CRM to send data
  if (!payData) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748B', fontSize: 14 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Loading payment details…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#0052FF', borderRadius: 7, display: 'grid', placeItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M13 2L4.5 13H11L10 22L19.5 11H13Z"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Secure Checkout</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
          <span style={{ width: 6, height: 6, background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />
          SSL · GoPayFast
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 440, margin: '0 auto', width: '100%' }}>
        {/* Amount */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
            {payData.description || 'Amount Due'}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, color: '#0052FF' }}>
            {payData.currency || 'PKR'} {Number(payData.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Your Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748B', marginBottom: 5, display: 'block' }}>Full Name *</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748B', marginBottom: 5, display: 'block' }}>Email *</label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748B', marginBottom: 5, display: 'block' }}>Phone</label>
              <input style={inp} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#EF4444', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button onClick={pay} disabled={loading} style={{ width: '100%', background: '#0052FF', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Processing…' : `Pay ${payData.currency || 'PKR'} ${Number(payData.amount).toLocaleString()} →`}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94A3B8' }}>
          🔒 Secured by GoPayFast · 10x Digital Ventures
        </div>
      </div>
    </div>
  );
}

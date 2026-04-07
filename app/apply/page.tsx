'use client';

import { useState } from 'react';

const input = {
  width: '100%',
  background: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#0F172A',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
} as const;

const label = { fontSize: 12, color: '#64748B', marginBottom: 6, display: 'block', fontWeight: 600 } as const;

export default function ApplyPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', id_number: '',
    business_name: '', business_type: 'sole_proprietor', registration_number: '', vat_number: '', website: '', business_category: '', monthly_turnover: '', business_description: '',
    address_line1: '', address_line2: '', city: '', province: '', postal_code: '', country: 'Pakistan',
    bank_name: '', account_holder: '', account_number: '', account_type: 'cheque', branch_code: '',
    ghl_location_id: '', payment_solution: 'CRM Payments', additional_information: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to submit application');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif' }}><div style={{ maxWidth: 520, width: '100%', background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: 32, textAlign: 'center' }}><div style={{ fontSize: 42, marginBottom: 12 }}>✅</div><h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, marginBottom: 10 }}>Application Submitted</h1><p style={{ color: '#64748B', lineHeight: 1.6 }}>Your GoPayFast merchant application has been received. Our team will review it and contact you shortly.</p></div></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 20px', fontFamily: 'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#0F172A' }}>GoPayFast Merchant Application</div>
          <div style={{ color: '#64748B', marginTop: 8 }}>Apply for your merchant account through 10x Digital Ventures.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <section style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 18, padding: 22 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 16 }}>Personal</h2>
            <div style={{ marginBottom: 14 }}><label style={label}>Full Name *</label><input style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Email *</label><input style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Phone *</label><input style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><label style={label}>ID Number</label><input style={input} value={form.id_number} onChange={(e) => set('id_number', e.target.value)} /></div>
          </section>

          <section style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 18, padding: 22 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 16 }}>Business</h2>
            <div style={{ marginBottom: 14 }}><label style={label}>Business Name *</label><input style={input} value={form.business_name} onChange={(e) => set('business_name', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Business Type *</label><select style={input} value={form.business_type} onChange={(e) => set('business_type', e.target.value)}><option value="sole_proprietor">Sole Proprietor</option><option value="partnership">Partnership</option><option value="pty_ltd">Pty Ltd</option><option value="cc">CC</option><option value="npo">NPO</option><option value="trust">Trust</option><option value="other">Other</option></select></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Business Category</label><input style={input} value={form.business_category} onChange={(e) => set('business_category', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Monthly Turnover</label><input style={input} value={form.monthly_turnover} onChange={(e) => set('monthly_turnover', e.target.value)} /></div>
            <div><label style={label}>Business Description</label><textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={form.business_description} onChange={(e) => set('business_description', e.target.value)} /></div>
          </section>

          <section style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 18, padding: 22 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 16 }}>Address</h2>
            <div style={{ marginBottom: 14 }}><label style={label}>Address Line 1</label><input style={input} value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Address Line 2</label><input style={input} value={form.address_line2} onChange={(e) => set('address_line2', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={label}>City</label><input style={input} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div><label style={label}>Province</label><input style={input} value={form.province} onChange={(e) => set('province', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div><label style={label}>Postal Code</label><input style={input} value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} /></div>
              <div><label style={label}>Country</label><input style={input} value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
            </div>
          </section>

          <section style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 18, padding: 22 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 16 }}>Banking & CRM</h2>
            <div style={{ marginBottom: 14 }}><label style={label}>Bank Name</label><input style={input} value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Account Holder</label><input style={input} value={form.account_holder} onChange={(e) => set('account_holder', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={label}>Account Number</label><input style={input} value={form.account_number} onChange={(e) => set('account_number', e.target.value)} /></div>
              <div><label style={label}>Branch Code</label><input style={input} value={form.branch_code} onChange={(e) => set('branch_code', e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 14, marginBottom: 14 }}><label style={label}>CRM Location ID</label><input style={input} value={form.ghl_location_id} onChange={(e) => set('ghl_location_id', e.target.value)} /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Payment Solution</label><select style={input} value={form.payment_solution} onChange={(e) => set('payment_solution', e.target.value)}><option value="CRM Payments">CRM Payments</option><option value="Payment Links">Payment Links</option><option value="Invoices">Invoices</option><option value="All of the above">All of the above</option></select></div>
            <div><label style={label}>Additional Information</label><textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={form.additional_information} onChange={(e) => set('additional_information', e.target.value)} /></div>
          </section>
        </div>

        {error && <div style={{ marginTop: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', borderRadius: 12, padding: '12px 16px' }}>{error}</div>}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={submit} disabled={loading} style={{ background: '#0052FF', color: 'white', border: 'none', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

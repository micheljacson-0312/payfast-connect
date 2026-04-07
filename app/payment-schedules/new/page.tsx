'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function NewPaymentSchedulePage() {
  const [form, setForm] = useState({ client_name: '', client_email: '', contact_id: '', total_amount: '', installments: '3', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ installment_num: number; amount: number; due_date: string; token: string }[] | null>(null);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const input = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
  const label = { fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' } as const;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/payment-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create installment plan');
      setLoading(false);
      return;
    }
    setCreated(data.installments);
    setLoading(false);
  }

  if (created) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content" style={{ padding: 32 }}>
          <div style={{ maxWidth: 780, margin:'0 auto', background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, marginBottom:8 }}>Installment Plan Created</h2>
            <p style={{ color:'var(--gray)', marginBottom:22 }}>Share each due payment link with the customer.</p>
            <div style={{ display:'grid', gap:12 }}>
              {created.map((item) => {
                const url = `${appUrl}/pay/${item.token}`;
                return (
                  <div key={item.token} style={{ background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:14 }}>
                    <div>
                      <div style={{ fontWeight:600 }}>Installment {item.installment_num}</div>
                      <div style={{ fontSize:12, color:'var(--gray)', marginTop:4 }}>PKR {Number(item.amount).toLocaleString()} · Due {new Date(item.due_date).toLocaleDateString('en-PK')}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={url} target="_blank" style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'7px 12px', borderRadius:7, fontSize:12, textDecoration:'none' }}>Open</a>
                      <button type="button" onClick={() => navigator.clipboard.writeText(url)} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--gray)', padding:'7px 12px', borderRadius:7, fontSize:12, cursor:'pointer' }}>Copy</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/payment-schedules" style={{ display:'inline-block', marginTop:18, background:'var(--blue)', color:'white', padding:'10px 18px', borderRadius:8, fontSize:13 }}>Back to Installments</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'18px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/payment-schedules" style={{ color:'var(--gray)', fontSize:14 }}>← Installments</Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>New Installment Plan</h2>
        </div>
        <div style={{ padding:'28px', maxWidth:720 }}>
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={label}>Client Name *</label><input style={input} value={form.client_name} onChange={(e) => set('client_name', e.target.value)} /></div>
              <div><label style={label}>Client Email *</label><input style={input} type="email" value={form.client_email} onChange={(e) => set('client_email', e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={label}>CRM Contact ID</label><input style={input} value={form.contact_id} onChange={(e) => set('contact_id', e.target.value)} /></div>
              <div><label style={label}>Total Amount (PKR) *</label><input style={input} type="number" value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={label}>Number of Installments *</label><input style={input} type="number" min="2" max="12" value={form.installments} onChange={(e) => set('installments', e.target.value)} /></div>
              <div><label style={label}>Description</label><input style={input} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Website project balance" /></div>
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)', marginBottom:16 }}>{error}</div>}
            <button onClick={save} disabled={loading} style={{ background:'var(--blue)', color:'white', border:'none', padding:'13px 20px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>
              {loading ? 'Creating…' : '🗓️ Create Installment Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

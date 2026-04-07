'use client';
import { useState } from 'react';
const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
const lbl = { fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' } as const;

export default function NewCouponForm() {
  const [form, setForm] = useState({ code:'', name:'', type:'percent', value:'', min_amount:'0', max_uses:'0', expires_at:'' });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  function genCode() {
    const chars='ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
    set('code', Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join(''));
  }

  async function save() {
    if (!form.code.trim()||!form.value) { setError('Code and value required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/coupons', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    setOk(true); setForm({ code:'', name:'', type:'percent', value:'', min_amount:'0', max_uses:'0', expires_at:'' });
    setLoading(false); setTimeout(()=>setOk(false),3000);
  }

  return (
    <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:16, padding:24, position:'sticky', top:20 }}>
      <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, marginBottom:18 }}>Create Coupon</div>
      <div style={{ marginBottom:14 }}>
        <label style={lbl}>Coupon Code *</label>
        <div style={{ display:'flex', gap:8 }}>
          <input style={inp} value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="SAVE20" />
          <button onClick={genCode} style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'var(--gray)', borderRadius:9, padding:'0 12px', cursor:'pointer', fontSize:11, whiteSpace:'nowrap' }}>Auto</button>
        </div>
      </div>
      <div style={{ marginBottom:14 }}><label style={lbl}>Name (internal)</label><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="20% off promo" /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <label style={lbl}>Discount Type</label>
          <select style={{...inp,cursor:'pointer'}} value={form.type} onChange={e=>set('type',e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (PKR)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Value *</label>
          <input style={inp} type="number" placeholder={form.type==='percent'?'e.g. 20':'e.g. 500'} value={form.value} onChange={e=>set('value',e.target.value)} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div><label style={lbl}>Min Order (PKR)</label><input style={inp} type="number" value={form.min_amount} onChange={e=>set('min_amount',e.target.value)} /></div>
        <div><label style={lbl}>Max Uses (0=unlimited)</label><input style={inp} type="number" value={form.max_uses} onChange={e=>set('max_uses',e.target.value)} /></div>
      </div>
      <div style={{ marginBottom:16 }}><label style={lbl}>Expiry Date (optional)</label><input style={inp} type="datetime-local" value={form.expires_at} onChange={e=>set('expires_at',e.target.value)} /></div>
      {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--danger)', marginBottom:10 }}>{error}</div>}
      {ok    && <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#22C55E', marginBottom:10 }}>✅ Coupon created!</div>}
      <button onClick={save} disabled={loading} style={{ width:'100%', background:'var(--blue)', color:'white', border:'none', padding:'12px', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>
        {loading?'Saving…':'+ Create Coupon'}
      </button>
    </div>
  );
}

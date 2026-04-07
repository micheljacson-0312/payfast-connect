'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface T2P { id:number; contact_name:string; phone:string; amount:number; description:string; status:string; created_at:string; token:string; }

export default function Text2PayPage() {
  const [list, setList]     = useState<T2P[]>([]);
  const [form, setForm]     = useState({ contact_name:'', phone:'', email:'', amount:'', description:'' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => { fetch('/api/text2pay').then(r=>r.json()).then(setList).catch(()=>{}); }, []);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));
  const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;

  async function send() {
    if (!form.phone.trim()||!form.amount) { setError('Phone and amount required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/text2pay', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    setList(l=>[data,...l]); setSent(true); setForm({ contact_name:'', phone:'', email:'', amount:'', description:'' });
    setLoading(false); setTimeout(()=>setSent(false), 3000);
  }

  const statusColor = (s:string) => ({ sent:{bg:'rgba(0,82,255,0.1)',color:'#3D7FFF'}, viewed:{bg:'rgba(167,139,250,0.1)',color:'#A78BFA'}, paid:{bg:'rgba(34,197,94,0.1)',color:'#22C55E'}, expired:{bg:'rgba(138,155,192,0.1)',color:'var(--gray)'} })[s]||{bg:'transparent',color:'var(--gray)'};

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Text2Pay</h2>
          <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>Send payment requests via WhatsApp / SMS link</p>
        </div>
        <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'400px 1fr', gap:24, alignItems:'start' }}>
          {/* Form */}
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:16, padding:24, position:'sticky', top:20 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, marginBottom:18 }}>Send Payment Request</div>
            {[
              { k:'contact_name', label:'Contact Name', placeholder:'Client name', type:'text' },
              { k:'phone',        label:'Phone / WhatsApp *', placeholder:'+92 300 0000000', type:'tel' },
              { k:'email',        label:'Email (optional)', placeholder:'client@email.com', type:'email' },
              { k:'amount',       label:'Amount (PKR) *', placeholder:'0.00', type:'number' },
            ].map(f=>(
              <div key={f.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' }}>{f.label}</label>
                <input style={inp} type={f.type} placeholder={f.placeholder} value={form[f.k as keyof typeof form]} onChange={e=>set(f.k,e.target.value)} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' }}>Description</label>
              <textarea style={{...inp,minHeight:70,resize:'vertical'}} placeholder="What is this payment for?" value={form.description} onChange={e=>set('description',e.target.value)} />
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--danger)', marginBottom:12 }}>{error}</div>}
            {sent  && <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#22C55E', marginBottom:12 }}>✅ Payment request created! Copy the link below.</div>}
            <button onClick={send} disabled={loading} style={{ width:'100%', background:'var(--blue)', color:'white', border:'none', padding:'12px', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>
              {loading?'Sending…':'📱 Generate Payment Link'}
            </button>
            <div style={{ marginTop:12, padding:14, background:'var(--dark3)', borderRadius:10, fontSize:12, color:'var(--gray)', lineHeight:1.6 }}>
              <strong style={{ color:'white' }}>How it works:</strong> A unique payment link is generated. Copy it and share via WhatsApp or SMS. When paid, CRM contact data is auto-updated.
            </div>
          </div>

          {/* List */}
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, marginBottom:14 }}>Recent Requests</div>
            {list.length === 0 && <div style={{ color:'var(--gray)', fontSize:14 }}>No requests sent yet.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {list.map(t=>{
                const sc = statusColor(t.status);
                const url = `${appUrl}/pay/${t.token}`;
                return (
                  <div key={t.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:12, padding:18, display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:40, height:40, background:'rgba(0,82,255,0.1)', borderRadius:10, display:'grid', placeItems:'center', fontSize:18, flexShrink:0 }}>📱</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:500, fontSize:14 }}>{t.contact_name||t.phone}</span>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:sc.bg, color:sc.color }}>{t.status}</span>
                      </div>
                      <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--gray)' }}>
                        <span>{t.phone}</span>
                        <span style={{ color:'#3D7FFF', fontWeight:600 }}>PKR {Number(t.amount).toLocaleString()}</span>
                        <span>{t.description?.slice(0,40)}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={()=>navigator.clipboard.writeText(url)} style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'6px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>Copy Link</button>
                      <a href={`https://wa.me/${t.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${t.contact_name||''}! Here is your payment link: ${url}`)}`} target="_blank" style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', color:'#22C55E', padding:'6px 12px', borderRadius:7, fontSize:11, textDecoration:'none' }}>WhatsApp</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

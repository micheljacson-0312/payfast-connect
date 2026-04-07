'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Product { id:number; name:string; price:number; type:string; }
const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
const lbl = { fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' } as const;
const fg  = { marginBottom:16 } as const;

export default function NewPaymentLinkPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name:'', description:'', product_id:'', amount:'', amount_type:'fixed',
    type:'one_time', interval:'monthly', max_uses:'0', expires_at:'',
    collect_phone:false, collect_address:false, allow_coupon:true,
    success_redirect:'', tag_on_pay:'paid', ghl_pipeline:'',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [created, setCreated] = useState<{url:string}|null>(null);

  useEffect(() => { fetch('/api/products').then(r=>r.json()).then(setProducts).catch(()=>{}); }, []);

  const set = (k:string, v:string|boolean) => setForm(f=>({...f,[k]:v}));
  const toggle = (k:string) => setForm(f=>({...f,[k]:!f[k as keyof typeof f]}));

  async function save() {
    if (!form.name.trim()) { setError('Link name is required'); return; }
    if (form.amount_type==='fixed' && !form.amount) { setError('Amount is required for fixed price links'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/payment-links', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    setCreated({ url: `${window.location.origin}/pay/${data.token}` });
    setLoading(false);
  }

  if (created) return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:20, padding:48, maxWidth:480, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:700, marginBottom:8 }}>Payment Link Created!</h2>
          <p style={{ color:'var(--gray)', fontSize:14, marginBottom:24 }}>Share this link with your customers to collect payment.</p>
          <div style={{ background:'var(--dark3)', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <code style={{ fontSize:12, color:'#3D7FFF', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left' }}>{created.url}</code>
            <button onClick={()=>navigator.clipboard.writeText(created.url)} style={{ background:'var(--blue)', border:'none', color:'white', padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer', flexShrink:0 }}>Copy</button>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <a href={created.url} target="_blank" style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'white', padding:'10px 20px', borderRadius:9, fontSize:13, textDecoration:'none' }}>Preview Link</a>
            <Link href="/payment-links" style={{ background:'var(--blue)', color:'white', padding:'10px 20px', borderRadius:9, fontSize:13 }}>Back to Links</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'18px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/payment-links" style={{ color:'var(--gray)', fontSize:14 }}>← Payment Links</Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>New Payment Link</h2>
        </div>
        <div style={{ padding:'28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:960, alignItems:'start' }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Link Details</div>
              <div style={fg}><label style={lbl}>Link Name *</label><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Monthly Retainer Payment" /></div>
              <div style={fg}><label style={lbl}>Description</label><textarea style={{...inp,minHeight:70,resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What is this payment for?" /></div>

              {/* Amount type */}
              <div style={fg}>
                <label style={lbl}>Pricing</label>
                <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                  {[['fixed','Fixed Amount'],['custom','Customer Sets Amount']].map(([v,l])=>(
                    <button key={v} onClick={()=>set('amount_type',v)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid', fontSize:12, cursor:'pointer', fontFamily:'inherit', background:form.amount_type===v?'rgba(0,82,255,0.1)':'transparent', color:form.amount_type===v?'#3D7FFF':'var(--gray)', borderColor:form.amount_type===v?'rgba(0,82,255,0.3)':'var(--border)' }}>{l}</button>
                  ))}
                </div>
                {form.amount_type==='fixed' && <input style={inp} type="number" placeholder="Amount in PKR" value={form.amount} onChange={e=>set('amount',e.target.value)} />}
              </div>

              {/* Product */}
              {products.length > 0 && (
                <div style={fg}>
                  <label style={lbl}>Link to Product (optional)</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
                    <option value="">— No product —</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} — PKR {Number(p.price).toLocaleString()}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Type */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Payment Type</div>
              <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                {[['one_time','One-Time'],['subscription','Subscription']].map(([v,l])=>(
                  <button key={v} onClick={()=>set('type',v)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid', fontSize:13, cursor:'pointer', fontFamily:'inherit', background:form.type===v?'rgba(0,82,255,0.1)':'transparent', color:form.type===v?'#3D7FFF':'var(--gray)', borderColor:form.type===v?'rgba(0,82,255,0.3)':'var(--border)' }}>{l}</button>
                ))}
              </div>
              {form.type==='subscription' && (
                <select style={{...inp,cursor:'pointer'}} value={form.interval} onChange={e=>set('interval',e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Limits */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Limits & Expiry</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Max Uses (0 = unlimited)</label><input style={inp} type="number" min="0" value={form.max_uses} onChange={e=>set('max_uses',e.target.value)} /></div>
                <div><label style={lbl}>Expiry Date (optional)</label><input style={inp} type="datetime-local" value={form.expires_at} onChange={e=>set('expires_at',e.target.value)} /></div>
              </div>
            </div>

            {/* Options */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Form Options</div>
              {[
                { key:'collect_phone',   label:'Collect phone number',   desc:'Ask payer for phone' },
                { key:'collect_address', label:'Collect billing address', desc:'Ask payer for address' },
                { key:'allow_coupon',    label:'Allow coupon codes',      desc:'Payer can apply discounts' },
              ].map(o=>(
                <div key={o.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{o.label}</div>
                    <div style={{ fontSize:11, color:'var(--gray)' }}>{o.desc}</div>
                  </div>
                  <div onClick={()=>toggle(o.key)} style={{ width:38, height:20, background:form[o.key as keyof typeof form]?'var(--blue)':'var(--dark3)', borderRadius:10, position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left:form[o.key as keyof typeof form]?18:2, width:16, height:16, background:'white', borderRadius:'50%', transition:'left .2s' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14 }}>
                <label style={lbl}>Redirect URL after payment (optional)</label>
                <input style={inp} type="url" placeholder="https://yoursite.com/thank-you" value={form.success_redirect} onChange={e=>set('success_redirect',e.target.value)} />
              </div>
            </div>

            {/* CRM */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:14 }}>CRM Integration</div>
              <div style={fg}><label style={lbl}>Tags to apply on payment</label><input style={inp} value={form.tag_on_pay} onChange={e=>set('tag_on_pay',e.target.value)} placeholder="paid,link-payment" /></div>
              <div><label style={lbl}>Move to Pipeline Stage</label><input style={inp} value={form.ghl_pipeline} onChange={e=>set('ghl_pipeline',e.target.value)} placeholder="won" /></div>
            </div>

            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)' }}>{error}</div>}
            <button onClick={save} disabled={loading} style={{ background:'var(--blue)', color:'white', border:'none', padding:'13px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>
              {loading?'Creating…':'⚡ Create Payment Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

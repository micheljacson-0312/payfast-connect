'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Product { id:number; name:string; price:number; }
const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
const lbl = { fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' } as const;
const fg  = { marginBottom:16 } as const;

export default function NewOrderFormPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    title:'', description:'', product_id:'', amount:'', currency:'PKR', type:'one_time',
    collect_name:true, collect_email:true, collect_phone:false, collect_address:false,
    button_text:'Pay Now', success_message:'Thank you! Your payment was successful.',
    success_redirect:'', tag_on_pay:'paid', pipeline_stage:'won', allow_coupon:true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{url:string;embedCode:string}|null>(null);

  useEffect(() => { fetch('/api/products').then(r=>r.json()).then(setProducts).catch(()=>{}); }, []);

  const set = (k:string, v:string|boolean) => setForm(f=>({...f,[k]:v}));
  const toggle = (k:string) => setForm(f=>({...f,[k]:!f[k as keyof typeof f]}));

  async function save() {
    if (!form.title.trim()) { setError('Form title required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/order-forms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    setCreated({
      url: data.url,
      embedCode: `<iframe src="${data.url}" width="100%" height="650" frameborder="0" style="border:none;border-radius:12px"></iframe>`,
    });
    setLoading(false);
  }

  if (created) return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:20, padding:40, maxWidth:560, width:'100%' }}>
          <div style={{ fontSize:40, textAlign:'center', marginBottom:16 }}>🎉</div>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, textAlign:'center', marginBottom:8 }}>Order Form Created!</h2>
          <p style={{ color:'var(--gray)', fontSize:13, textAlign:'center', marginBottom:28 }}>Share the link or embed on your website.</p>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Direct Link</label>
            <div style={{ display:'flex', gap:8 }}>
              <input style={{...inp, fontFamily:'monospace', fontSize:12}} value={created.url} readOnly />
              <button onClick={()=>navigator.clipboard.writeText(created.url)} style={{ background:'var(--blue)', border:'none', color:'white', borderRadius:9, padding:'0 14px', cursor:'pointer', fontSize:12, flexShrink:0 }}>Copy</button>
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Embed Code (paste into your website HTML)</label>
            <div style={{ display:'flex', gap:8 }}>
              <textarea style={{...inp, minHeight:80, fontFamily:'monospace', fontSize:11, resize:'vertical'}} value={created.embedCode} readOnly />
              <button onClick={()=>navigator.clipboard.writeText(created.embedCode)} style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'var(--gray)', borderRadius:9, padding:'0 12px', cursor:'pointer', fontSize:11, flexShrink:0 }}>Copy</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <a href={created.url} target="_blank" style={{ flex:1, background:'var(--dark3)', border:'1px solid var(--border)', color:'white', padding:'11px', borderRadius:9, fontSize:13, textAlign:'center', textDecoration:'none' }}>Preview Form</a>
            <Link href="/order-forms" style={{ flex:1, background:'var(--blue)', color:'white', padding:'11px', borderRadius:9, fontSize:13, textAlign:'center' }}>All Forms</Link>
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
          <Link href="/order-forms" style={{ color:'var(--gray)', fontSize:14 }}>← Order Forms</Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>New Order Form</h2>
        </div>
        <div style={{ padding:'28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:960, alignItems:'start' }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Form Details</div>
              <div style={fg}><label style={lbl}>Form Title *</label><input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Course Registration Form" /></div>
              <div style={fg}><label style={lbl}>Description</label><textarea style={{...inp, minHeight:70, resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe what this form is for" /></div>
              {products.length > 0 && (
                <div style={fg}><label style={lbl}>Link to Product</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
                    <option value="">— Custom amount —</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} — PKR {Number(p.price).toLocaleString()}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Amount (PKR)</label><input style={inp} type="number" placeholder="Leave blank for custom" value={form.amount} onChange={e=>set('amount',e.target.value)} /></div>
                <div><label style={lbl}>Payment Type</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.type} onChange={e=>set('type',e.target.value)}>
                    <option value="one_time">One-Time</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Fields to Collect</div>
              {[
                { k:'collect_name',    label:'Full Name',       desc:'Required by default' },
                { k:'collect_email',   label:'Email Address',   desc:'Required by default' },
                { k:'collect_phone',   label:'Phone Number',    desc:'Optional' },
                { k:'collect_address', label:'Billing Address', desc:'Optional' },
              ].map(o=>(
                <div key={o.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div><div style={{ fontSize:13, fontWeight:500 }}>{o.label}</div><div style={{ fontSize:11, color:'var(--gray)' }}>{o.desc}</div></div>
                  <div onClick={()=>toggle(o.k)} style={{ width:38, height:20, background:form[o.k as keyof typeof form]?'var(--blue)':'var(--dark3)', borderRadius:10, position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:2, left:form[o.k as keyof typeof form]?18:2, width:16, height:16, background:'white', borderRadius:'50%', transition:'left .2s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Customization</div>
              <div style={fg}><label style={lbl}>Button Text</label><input style={inp} value={form.button_text} onChange={e=>set('button_text',e.target.value)} /></div>
              <div style={fg}><label style={lbl}>Success Message</label><input style={inp} value={form.success_message} onChange={e=>set('success_message',e.target.value)} /></div>
              <div><label style={lbl}>Redirect URL after payment (optional)</label><input style={inp} type="url" placeholder="https://yoursite.com/thank-you" value={form.success_redirect} onChange={e=>set('success_redirect',e.target.value)} /></div>
            </div>

            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:14 }}>CRM Integration</div>
              <div style={fg}><label style={lbl}>CRM Tags on payment</label><input style={inp} value={form.tag_on_pay} onChange={e=>set('tag_on_pay',e.target.value)} placeholder="paid,form-submission" /></div>
              <div style={fg}><label style={lbl}>Move Opportunity to Stage</label><input style={inp} value={form.pipeline_stage} onChange={e=>set('pipeline_stage',e.target.value)} placeholder="won" /></div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid var(--border)' }}>
                <div><div style={{ fontSize:13, fontWeight:500 }}>Allow Coupon Codes</div><div style={{ fontSize:11, color:'var(--gray)' }}>Payers can apply discount codes</div></div>
                <div onClick={()=>toggle('allow_coupon')} style={{ width:38, height:20, background:form.allow_coupon?'var(--blue)':'var(--dark3)', borderRadius:10, position:'relative', cursor:'pointer', transition:'background .2s' }}>
                  <div style={{ position:'absolute', top:2, left:form.allow_coupon?18:2, width:16, height:16, background:'white', borderRadius:'50%', transition:'left .2s' }} />
                </div>
              </div>
            </div>

            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)' }}>{error}</div>}
            <button onClick={save} disabled={loading} style={{ background:'var(--blue)', color:'white', border:'none', padding:'13px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1 }}>
              {loading?'Creating…':'📋 Create Order Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', description:'', price:'', type:'one_time', interval:'monthly', currency:'PKR', is_active:true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k:string, v:string|boolean) => setForm(f=>({...f,[k]:v}));
  const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 15px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
  const lbl = { fontSize:13, color:'var(--gray)', marginBottom:8, display:'block' } as const;

  async function save() {
    if (!form.name.trim() || !form.price) { setError('Name and price are required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    router.push('/products');
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="resp-padding" style={{ borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <Link href="/products" style={{ color:'var(--gray)', fontSize:14 }}>← Products</Link>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>New Product</h2>
        </div>
        <div className="resp-padding" style={{ maxWidth:560 }}>
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:16, padding:28 }}>
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Product / Service Name *</label>
              <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Monthly SEO Package" />
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Description</label>
              <textarea style={{...inp, minHeight:80, resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What does this product include?" />
            </div>
            <div className="mobile-stack-2" style={{ marginBottom:18 }}>
              <div>
                <label style={lbl}>Price *</label>
                <input style={inp} type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <select style={{...inp,cursor:'pointer'}} value={form.currency} onChange={e=>set('currency',e.target.value)}>
                  <option value="PKR">PKR — Pakistani Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="ZAR">ZAR — South African Rand</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Billing Type</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[['one_time','One-Time'],['recurring','Recurring'],['free','Free']].map(([v,l])=>(
                  <button key={v} type="button" onClick={()=>set('type',v)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid', fontSize:13, cursor:'pointer', fontFamily:'inherit', background: form.type===v ? 'rgba(0,82,255,0.1)' : 'transparent', color: form.type===v ? '#3D7FFF' : 'var(--gray)', borderColor: form.type===v ? 'rgba(0,82,255,0.35)' : 'var(--border)' }}>{l}</button>
                ))}
              </div>
            </div>
            {form.type==='recurring' && (
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>Billing Interval</label>
                <select style={{...inp,cursor:'pointer'}} value={form.interval} onChange={e=>set('interval',e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderTop:'1px solid var(--border)', marginTop:4 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500 }}>Active</div>
                <div style={{ fontSize:12, color:'var(--gray)' }}>Show in product catalog</div>
              </div>
              <div onClick={()=>set('is_active',!form.is_active)} style={{ width:40, height:22, background: form.is_active ? 'var(--blue)' : 'var(--dark3)', borderRadius:11, position:'relative', cursor:'pointer', transition:'background .2s' }}>
                <div style={{ position:'absolute', top:2, left: form.is_active ? 20 : 2, width:18, height:18, background:'white', borderRadius:'50%', transition:'left .2s' }} />
              </div>
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)', margin:'12px 0 0' }}>{error}</div>}
            <button onClick={save} disabled={loading} style={{ width:'100%', background:'var(--blue)', color:'white', border:'none', padding:'13px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', marginTop:20, fontFamily:'inherit', opacity:loading?0.6:1 }}>
              {loading ? 'Saving…' : '+ Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

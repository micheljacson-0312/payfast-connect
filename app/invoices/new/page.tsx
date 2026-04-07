'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface LineItem { name:string; description:string; quantity:string; unit_price:string; }
interface Product  { id:number; name:string; price:number; description:string; }

const EMPTY_ITEM: LineItem = { name:'', description:'', quantity:'1', unit_price:'' };
const inp = { width:'100%', background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', color:'white', fontSize:13, outline:'none', fontFamily:'inherit' } as const;
const lbl = { fontSize:12, color:'var(--gray)', marginBottom:6, display:'block' } as const;

export default function NewInvoicePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'line_items'|'simple'>('line_items');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [form, setForm] = useState({
    client_name:'', client_email:'', client_phone:'', client_address:'',
    title:'Invoice', notes:'', terms:'Payment due within 30 days.',
    issue_date: new Date().toISOString().split('T')[0],
    due_date:'',
    discount_type:'percent', discount_value:'0',
    tax_rate:'0',
    simple_amount:'', simple_description:'',
    tag_on_pay:'paid,invoice-paid',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/products').then(r=>r.json()).then(setProducts).catch(()=>{});
  }, []);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  // Line item helpers
  const setItem = (i:number, k:keyof LineItem, v:string) =>
    setItems(its => its.map((it,idx) => idx===i ? {...it,[k]:v} : it));

  const addItem = () => setItems(its=>[...its,{...EMPTY_ITEM}]);
  const removeItem = (i:number) => setItems(its=>its.filter((_,idx)=>idx!==i));

  const addProduct = (p:Product) => setItems(its=>[...its,{ name:p.name, description:p.description||'', quantity:'1', unit_price:String(p.price) }]);

  // Calculations
  const subtotal = mode==='simple'
    ? parseFloat(form.simple_amount||'0')
    : items.reduce((s,it)=>s + (parseFloat(it.quantity||'0') * parseFloat(it.unit_price||'0')),0);

  const discAmt = form.discount_type==='percent'
    ? subtotal * (parseFloat(form.discount_value||'0')/100)
    : parseFloat(form.discount_value||'0');

  const taxAmt  = (subtotal - discAmt) * (parseFloat(form.tax_rate||'0')/100);
  const total   = subtotal - discAmt + taxAmt;

  const fmt = (n:number) => `PKR ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')}`;

  async function save(sendNow=false) {
    if (!form.client_name.trim()||!form.client_email.includes('@')) { setError('Client name and valid email required'); return; }
    if (mode==='simple' && !form.simple_amount) { setError('Amount is required'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/invoices', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, mode, items, subtotal, discount_amount:discAmt, tax_amount:taxAmt, total, send_now:sendNow }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error||'Failed'); setLoading(false); return; }
    router.push(sendNow ? `/invoice/${data.token}` : '/invoices');
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'18px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <Link href="/invoices" style={{ color:'var(--gray)', fontSize:14 }}>← Invoices</Link>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>New Invoice</h2>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>save(false)} disabled={loading} style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'white', padding:'8px 20px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Save Draft</button>
            <button onClick={()=>save(true)}  disabled={loading} style={{ background:'var(--blue)', color:'white', border:'none', padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
              {loading?'Saving…':'Save & Send Link'}
            </button>
          </div>
        </div>

        <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Mode toggle */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
              <div style={{ display:'flex', gap:4, background:'var(--dark3)', padding:4, borderRadius:9, width:'fit-content', marginBottom:20 }}>
                {(['line_items','simple'] as const).map(m=>(
                  <button key={m} onClick={()=>setMode(m)} style={{ padding:'7px 18px', borderRadius:7, border:'none', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', background: mode===m?'var(--blue)':'transparent', color: mode===m?'white':'var(--gray)' }}>
                    {m==='line_items'?'📋 Line Items':'⚡ Simple'}
                  </button>
                ))}
              </div>

              {mode==='line_items' ? (
                <>
                  {/* Product quick-add */}
                  {products.length>0 && (
                    <div style={{ marginBottom:16 }}>
                      <label style={lbl}>Quick Add Product</label>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {products.filter(p=>p).map(p=>(
                          <button key={p.id} onClick={()=>addProduct(p)} style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                            + {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Line items */}
                  <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr 1fr 1.5fr auto', gap:8, fontSize:11, color:'var(--gray)', marginBottom:8, padding:'0 4px' }}>
                    <div>Item</div><div>Description</div><div>Qty</div><div>Price</div><div></div>
                  </div>
                  {items.map((it,i)=>(
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 2fr 1fr 1.5fr auto', gap:8, marginBottom:8, alignItems:'center' }}>
                      <input style={{...inp,padding:'8px 10px'}} placeholder="Item name" value={it.name} onChange={e=>setItem(i,'name',e.target.value)} />
                      <input style={{...inp,padding:'8px 10px'}} placeholder="Description" value={it.description} onChange={e=>setItem(i,'description',e.target.value)} />
                      <input style={{...inp,padding:'8px 10px'}} type="number" min="1" value={it.quantity} onChange={e=>setItem(i,'quantity',e.target.value)} />
                      <input style={{...inp,padding:'8px 10px'}} type="number" placeholder="0.00" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} />
                      <button onClick={()=>removeItem(i)} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'var(--danger)', borderRadius:7, padding:'7px 10px', cursor:'pointer', fontSize:13 }}>×</button>
                    </div>
                  ))}
                  <button onClick={addItem} style={{ background:'transparent', border:'1px dashed rgba(0,82,255,0.3)', color:'#3D7FFF', borderRadius:8, padding:'8px 16px', fontSize:12, cursor:'pointer', fontFamily:'inherit', width:'100%', marginTop:4 }}>+ Add Line Item</button>
                </>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
                  <div>
                    <label style={lbl}>Amount (PKR) *</label>
                    <input style={inp} type="number" placeholder="0.00" value={form.simple_amount} onChange={e=>set('simple_amount',e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Description *</label>
                    <input style={inp} placeholder="What is this payment for?" value={form.simple_description} onChange={e=>set('simple_description',e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:16 }}>Client Information</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Client Name *</label><input style={inp} value={form.client_name} onChange={e=>set('client_name',e.target.value)} placeholder="Full name or company" /></div>
                <div><label style={lbl}>Email *</label><input style={inp} type="email" value={form.client_email} onChange={e=>set('client_email',e.target.value)} placeholder="client@email.com" /></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={form.client_phone} onChange={e=>set('client_phone',e.target.value)} placeholder="+92 300 0000000" /></div>
                <div><label style={lbl}>Due Date</label><input style={inp} type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} /></div>
              </div>
              <div style={{ marginTop:14 }}>
                <label style={lbl}>Billing Address</label>
                <textarea style={{...inp, minHeight:60, resize:'vertical'}} value={form.client_address} onChange={e=>set('client_address',e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>

            {/* Notes + Terms */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Notes (shown on invoice)</label>
                  <textarea style={{...inp, minHeight:80, resize:'vertical'}} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Thank you for your business!" />
                </div>
                <div>
                  <label style={lbl}>Terms & Conditions</label>
                  <textarea style={{...inp, minHeight:80, resize:'vertical'}} value={form.terms} onChange={e=>set('terms',e.target.value)} />
                </div>
              </div>
            </div>

            {/* CRM Tags */}
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:600, marginBottom:12 }}>CRM Automation</div>
              <div>
                <label style={lbl}>Tags to add when paid (comma-separated)</label>
                <input style={inp} value={form.tag_on_pay} onChange={e=>set('tag_on_pay',e.target.value)} placeholder="paid,invoice-paid" />
              </div>
            </div>

            {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--danger)' }}>{error}</div>}
          </div>

          {/* Right — Summary */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, marginBottom:16 }}>Invoice Summary</div>

              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Invoice Title</label>
                <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div><label style={lbl}>Issue Date</label><input style={inp} type="date" value={form.issue_date} onChange={e=>set('issue_date',e.target.value)} /></div>
                <div><label style={lbl}>Tax Rate (%)</label><input style={inp} type="number" min="0" max="100" value={form.tax_rate} onChange={e=>set('tax_rate',e.target.value)} /></div>
              </div>

              {/* Discount */}
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Discount</label>
                <div style={{ display:'flex', gap:8 }}>
                  <select style={{...inp, width:'auto', padding:'10px 12px', cursor:'pointer'}} value={form.discount_type} onChange={e=>set('discount_type',e.target.value)}>
                    <option value="percent">%</option>
                    <option value="fixed">PKR</option>
                  </select>
                  <input style={inp} type="number" min="0" value={form.discount_value} onChange={e=>set('discount_value',e.target.value)} placeholder="0" />
                </div>
              </div>

              {/* Totals */}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
                {[
                  { label:'Subtotal', val:fmt(subtotal) },
                  ...(discAmt>0 ? [{ label:`Discount (${form.discount_type==='percent'?form.discount_value+'%':'PKR '+form.discount_value})`, val:`-${fmt(discAmt)}` }] : []),
                  ...(taxAmt>0  ? [{ label:`Tax (${form.tax_rate}%)`, val:fmt(taxAmt) }] : []),
                ].map(r=>(
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--gray)', padding:'4px 0' }}>
                    <span>{r.label}</span><span>{r.val}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', borderTop:'1px solid var(--border)', marginTop:8 }}>
                  <span style={{ fontFamily:'var(--font-head)', fontWeight:700 }}>Total</span>
                  <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'#3D7FFF' }}>{fmt(total)}</span>
                </div>
              </div>

              <button onClick={()=>save(true)} disabled={loading} style={{ width:'100%', background:'var(--blue)', color:'white', border:'none', padding:'13px', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', marginTop:20, fontFamily:'inherit', opacity:loading?0.6:1 }}>
                {loading?'Saving…':'Save & Send Link →'}
              </button>
              <button onClick={()=>save(false)} disabled={loading} style={{ width:'100%', background:'transparent', border:'1px solid var(--border)', color:'var(--gray)', padding:'10px', borderRadius:10, fontSize:13, cursor:'pointer', marginTop:8, fontFamily:'inherit' }}>
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

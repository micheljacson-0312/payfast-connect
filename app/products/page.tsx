import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Product { id:number; name:string; description:string; price:number; type:string; interval:string; is_active:number; created_at:string; }

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect('/install');
  const products = await query<Product[]>('SELECT * FROM products WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Products & Services</h2>
            <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>{products.length} items in catalog</p>
          </div>
          <Link href="/products/new" style={{ background:'var(--blue)', color:'white', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:500 }}>+ New Product</Link>
        </div>
        <div style={{ padding:'24px 32px' }}>
          {products.length === 0 ? (
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📦</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:600, marginBottom:8 }}>No products yet</div>
              <div style={{ color:'var(--gray)', fontSize:14, marginBottom:24 }}>Add products to use in invoices, payment links, and order forms.</div>
              <Link href="/products/new" style={{ background:'var(--blue)', color:'white', padding:'10px 24px', borderRadius:9, fontSize:13, fontWeight:500 }}>+ Add First Product</Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {products.map(p => (
                <div key={p.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:22, transition:'border-color .2s' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, color:'white' }}>{p.name}</div>
                    <span style={{ fontSize:10, padding:'3px 8px', borderRadius:5, background: p.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(138,155,192,0.1)', color: p.is_active ? '#22C55E' : 'var(--gray)' }}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {p.description && <div style={{ fontSize:12, color:'var(--gray)', marginBottom:16, lineHeight:1.5 }}>{p.description.slice(0,80)}{p.description.length>80?'…':''}</div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:'#3D7FFF' }}>
                      PKR {Number(p.price).toLocaleString()}
                    </div>
                    <span style={{ fontSize:11, color:'var(--gray)', background:'var(--dark3)', padding:'3px 8px', borderRadius:5 }}>
                      {p.type === 'recurring' ? `${p.interval}` : p.type === 'free' ? 'Free' : 'One-time'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

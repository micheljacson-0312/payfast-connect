import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import NewCouponForm from './NewCouponForm';

interface Coupon { id:number; code:string; name:string; type:string; value:number; max_uses:number; uses_count:number; expires_at:string; is_active:number; }

export default async function CouponsPage() {
  const session = await getSession();
  if (!session) redirect('/install');
  const coupons = await query<Coupon[]>('SELECT * FROM coupons WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Coupons & Discounts</h2>
          <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>Discount codes for payment links and order forms</p>
        </div>
        <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'380px 1fr', gap:24, alignItems:'start' }}>
          <NewCouponForm />
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:600, marginBottom:14 }}>Active Coupons</div>
            {coupons.length===0 && <div style={{ color:'var(--gray)', fontSize:14 }}>No coupons created yet.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {coupons.map(c=>{
                const expired = c.expires_at && new Date(c.expires_at)<new Date();
                const maxed   = c.max_uses>0 && c.uses_count>=c.max_uses;
                const live    = c.is_active && !expired && !maxed;
                return (
                  <div key={c.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:12, padding:18, display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ background:'rgba(0,82,255,0.1)', borderRadius:8, padding:'8px 14px', fontFamily:'monospace', fontSize:16, fontWeight:700, color:'#3D7FFF', flexShrink:0, letterSpacing:1 }}>{c.code}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontWeight:500 }}>{c.name||c.code}</span>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:live?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:live?'#22C55E':'var(--danger)' }}>{live?'Active':expired?'Expired':'Inactive'}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray)' }}>
                        {c.type==='percent'?`${c.value}% off`:`PKR ${c.value} off`} ·
                        {c.uses_count} used {c.max_uses>0?`of ${c.max_uses}`:'(unlimited)'}
                        {c.expires_at ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                      </div>
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

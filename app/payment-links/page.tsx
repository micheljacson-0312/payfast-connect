import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import CopyLinkBtn from './CopyLinkBtn';

interface PLink { id:number; token:string; name:string; description:string; amount:number; amount_type:string; type:string; uses_count:number; max_uses:number; is_active:number; created_at:string; expires_at:string; }

export default async function PaymentLinksPage() {
  const session = await getSession();
  if (!session) redirect('/install');

  const links = await query<PLink[]>('SELECT * FROM payment_links WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Payment Links</h2>
            <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>Stripe-style shareable payment pages</p>
          </div>
          <Link href="/payment-links/new" style={{ background:'var(--blue)', color:'white', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:500 }}>+ New Link</Link>
        </div>

        <div style={{ padding:'24px 32px' }}>
          {links.length === 0 ? (
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔗</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:600, marginBottom:8 }}>No payment links yet</div>
              <div style={{ color:'var(--gray)', fontSize:14, marginBottom:24 }}>Create a link, share it with anyone — they pay, CRM records update automatically.</div>
              <Link href="/payment-links/new" style={{ background:'var(--blue)', color:'white', padding:'10px 24px', borderRadius:9, fontSize:13, fontWeight:500 }}>+ Create Payment Link</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {links.map(l => {
                const url = `${appUrl}/pay/${l.token}`;
                const expired = l.expires_at && new Date(l.expires_at) < new Date();
                const maxed = l.max_uses > 0 && l.uses_count >= l.max_uses;
                const live = l.is_active && !expired && !maxed;
                return (
                  <div key={l.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:13, padding:20, display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ width:44, height:44, background:'rgba(0,82,255,0.1)', borderRadius:10, display:'grid', placeItems:'center', fontSize:20, flexShrink:0 }}>🔗</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <span style={{ fontFamily:'var(--font-head)', fontWeight:600 }}>{l.name}</span>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background: live?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color: live?'#22C55E':'var(--danger)' }}>
                          {live ? '● Live' : expired ? 'Expired' : maxed ? 'Max uses' : 'Inactive'}
                        </span>
                        <span style={{ fontSize:11, color:'var(--gray)' }}>{l.type==='subscription'?'🔄 Recurring':'💳 One-time'}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray)', marginBottom:6 }}>{l.description?.slice(0,80)||'No description'}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                        <span style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'#3D7FFF', fontSize:16 }}>
                          {l.amount_type==='custom' ? 'Custom amount' : `PKR ${Number(l.amount).toLocaleString()}`}
                        </span>
                        <span style={{ fontSize:11, color:'var(--gray)' }}>{l.uses_count}{l.max_uses>0?'/'+l.max_uses:''} uses</span>
                        <code style={{ fontSize:11, color:'var(--gray)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:280 }}>{url}</code>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <CopyLinkBtn url={url} />
                      <a href={url} target="_blank" style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'var(--gray)', padding:'7px 14px', borderRadius:7, fontSize:12, textDecoration:'none' }}>Preview</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

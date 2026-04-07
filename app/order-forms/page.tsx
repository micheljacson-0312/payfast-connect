import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { CopyLinkBtn, CopyEmbedBtn } from './CopyButtons';

interface Form { id:number; slug:string; title:string; description:string; amount:number; type:string; submissions:number; is_active:number; created_at:string; token:string; }

export default async function OrderFormsPage() {
  const session = await getSession();
  if (!session) redirect('/install');
  const forms = await query<Form[]>('SELECT * FROM order_forms WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Order Forms</h2>
            <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>Embeddable checkout forms for your website</p>
          </div>
          <Link href="/order-forms/new" style={{ background:'var(--blue)', color:'white', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:500 }}>+ New Form</Link>
        </div>
        <div style={{ padding:'24px 32px' }}>
          {forms.length === 0 ? (
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:600, marginBottom:8 }}>No order forms yet</div>
              <div style={{ color:'var(--gray)', fontSize:14, marginBottom:24 }}>Embed a payment form on any website page.</div>
              <Link href="/order-forms/new" style={{ background:'var(--blue)', color:'white', padding:'10px 24px', borderRadius:9, fontSize:13, fontWeight:500 }}>+ Create First Form</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {forms.map(f=>{
                const pageUrl = `${appUrl}/pay/${f.token}`;
                const embedCode = `<iframe src="${pageUrl}" width="100%" height="600" frameborder="0"></iframe>`;
                return (
                  <div key={f.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:13, padding:20, display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ width:44, height:44, background:'rgba(0,82,255,0.1)', borderRadius:10, display:'grid', placeItems:'center', fontSize:20, flexShrink:0 }}>📋</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <span style={{ fontFamily:'var(--font-head)', fontWeight:600 }}>{f.title}</span>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:f.is_active?'rgba(34,197,94,0.1)':'rgba(139,155,192,0.1)', color:f.is_active?'#22C55E':'var(--gray)' }}>{f.is_active?'Active':'Inactive'}</span>
                        <span style={{ fontSize:11, color:'var(--gray)' }}>{f.submissions} submissions</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray)' }}>
                        {f.amount ? `PKR ${Number(f.amount).toLocaleString()}` : 'Custom amount'} · {f.type}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <CopyLinkBtn url={pageUrl} />
                      <CopyEmbedBtn code={embedCode} />
                      <a href={pageUrl} target="_blank" style={{ background:'var(--dark3)', border:'1px solid var(--border)', color:'var(--gray)', padding:'7px 12px', borderRadius:7, fontSize:11, textDecoration:'none' }}>Preview</a>
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

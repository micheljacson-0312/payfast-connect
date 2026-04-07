import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import CopyBtn from './CopyBtn';

interface Invoice { id:number; invoice_number:string; client_name:string; client_email:string; total:number; status:string; due_date:string; created_at:string; token:string; }

const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  draft:    {bg:'rgba(138,155,192,0.1)', color:'var(--gray)'},
  sent:     {bg:'rgba(0,82,255,0.1)',    color:'#3D7FFF'},
  viewed:   {bg:'rgba(167,139,250,0.1)', color:'#A78BFA'},
  paid:     {bg:'rgba(34,197,94,0.1)',   color:'#22C55E'},
  overdue:  {bg:'rgba(239,68,68,0.1)',   color:'var(--danger)'},
  cancelled:{bg:'rgba(138,155,192,0.1)', color:'var(--gray)'},
};

export default async function InvoicesPage({ searchParams }:{ searchParams: Promise<{status?:string}> }) {
  const session = await getSession();
  if (!session) redirect('/install');

  const sf = (await searchParams).status;
  const invoices = await query<Invoice[]>(
    `SELECT * FROM invoices WHERE location_id = ?${sf?` AND status='${sf}'`:''} ORDER BY created_at DESC`,
    [session.locationId]
  );

  const [totals] = await query<{total_paid:number;total_pending:number;count_overdue:number}[]>(
    `SELECT COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) AS total_paid,
            COALESCE(SUM(CASE WHEN status IN('sent','viewed') THEN total ELSE 0 END),0) AS total_pending,
            SUM(status='overdue') AS count_overdue
     FROM invoices WHERE location_id=?`, [session.locationId]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Invoices</h2>
            <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>{invoices.length} invoices</p>
          </div>
          <Link href="/invoices/new" style={{ background:'var(--blue)', color:'white', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:500 }}>+ New Invoice</Link>
        </div>

        <div style={{ padding:'24px 32px' }}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            {[
              { label:'Total Collected', value:`PKR ${Number(totals.total_paid).toLocaleString()}`, color:'#22C55E' },
              { label:'Outstanding',     value:`PKR ${Number(totals.total_pending).toLocaleString()}`, color:'#3D7FFF' },
              { label:'Overdue',         value:String(totals.count_overdue||0), color:totals.count_overdue>0?'var(--danger)':'var(--gray)' },
            ].map(s=>(
              <div key={s.label} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:13, padding:20 }}>
                <div style={{ fontSize:12, color:'var(--gray)', marginBottom:8 }}>{s.label}</div>
                <div style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
            {[undefined,'draft','sent','viewed','paid','overdue'].map(s=>(
              <Link key={s||'all'} href={`/invoices${s?`?status=${s}`:''}`} style={{ padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:500, border:'1px solid', textDecoration:'none', background: sf===s||(!sf&&!s)?'rgba(0,82,255,0.1)':'transparent', color: sf===s||(!sf&&!s)?'#3D7FFF':'var(--gray)', borderColor: sf===s||(!sf&&!s)?'rgba(0,82,255,0.3)':'var(--border)' }}>
                {s ? s.charAt(0).toUpperCase()+s.slice(1) : 'All'}
              </Link>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr 1fr 1fr 1.2fr', gap:12, padding:'12px 20px', background:'var(--dark3)', fontSize:11, color:'var(--gray)', textTransform:'uppercase', letterSpacing:'.5px' }}>
              <div>Invoice #</div><div>Client</div><div>Amount</div><div>Due Date</div><div>Status</div><div>Actions</div>
            </div>
            {invoices.length===0 && <div style={{ padding:48, textAlign:'center', color:'var(--gray)', fontSize:14 }}>No invoices yet. <Link href="/invoices/new" style={{ color:'#3D7FFF' }}>Create your first →</Link></div>}
            {invoices.map(inv=>{
              const sc = STATUS_STYLE[inv.status]||STATUS_STYLE.draft;
              return (
                <div key={inv.id} style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr 1fr 1fr 1.2fr', gap:12, padding:'14px 20px', borderBottom:'1px solid var(--border)', fontSize:13, alignItems:'center' }}>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:12, color:'#3D7FFF', fontWeight:600 }}>{inv.invoice_number}</div>
                  <div>
                    <div style={{ fontWeight:500 }}>{inv.client_name}</div>
                    <div style={{ fontSize:11, color:'var(--gray)' }}>{inv.client_email}</div>
                  </div>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:600 }}>PKR {Number(inv.total).toLocaleString()}</div>
                  <div style={{ fontSize:12, color:'var(--gray)' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-PK') : '—'}</div>
                  <div><span style={{ background:sc.bg, color:sc.color, padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:500 }}>{inv.status}</span></div>
                  <div style={{ display:'flex', gap:6 }}>
                    <a href={`${appUrl}/invoice/${inv.token}`} target="_blank" style={{ background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'4px 10px', borderRadius:6, fontSize:11, textDecoration:'none' }}>View</a>
                    <CopyBtn text={`${appUrl}/invoice/${inv.token}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import CopyScheduleLinkBtn from './CopyScheduleLinkBtn';

interface Schedule {
  id: number;
  client_name: string;
  client_email: string;
  total_amount: number;
  installments: number;
  paid_count: number;
  amount_paid: number;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export default async function PaymentSchedulesPage() {
  const session = await getSession();
  if (!session) redirect('/install');

  const schedules = await query<Schedule[]>(
    'SELECT * FROM payment_schedules WHERE location_id = ? ORDER BY created_at DESC',
    [session.locationId]
  );

  const installmentMap = schedules.length
    ? await query<any[]>(
        `SELECT schedule_id, installment_num, amount, due_date, token, status
         FROM schedule_installments
         WHERE schedule_id IN (${schedules.map(() => '?').join(',')})
         ORDER BY schedule_id, installment_num`,
        schedules.map((schedule) => schedule.id)
      )
    : [];

  const grouped = new Map<number, any[]>();
  installmentMap.forEach((row) => {
    const existing = grouped.get(row.schedule_id) || [];
    existing.push(row);
    grouped.set(row.schedule_id, existing);
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="resp-padding" style={{ borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Installments</h2>
            <p style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>Create installment payment plans and share each due payment link.</p>
          </div>
          <Link href="/payment-schedules/new" style={{ background:'var(--blue)', color:'white', padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:500 }}>+ New Plan</Link>
        </div>

        <div className="resp-padding">
          {schedules.length === 0 ? (
            <div style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🗓️</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:600, marginBottom:8 }}>No installment plans yet</div>
              <div style={{ color:'var(--gray)', fontSize:14, marginBottom:24 }}>Split large payments into smaller due payments with shareable links.</div>
              <Link href="/payment-schedules/new" style={{ background:'var(--blue)', color:'white', padding:'10px 24px', borderRadius:9, fontSize:13, fontWeight:500 }}>+ Create Installment Plan</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {schedules.map((schedule) => {
                const items = grouped.get(schedule.id) || [];
                return (
                  <div key={schedule.id} style={{ background:'var(--dark2)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700 }}>{schedule.client_name}</div>
                        <div style={{ fontSize:12, color:'var(--gray)', marginTop:4 }}>{schedule.client_email} {schedule.description ? `· ${schedule.description}` : ''}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'var(--font-head)', fontSize:18, color:'#3D7FFF' }}>PKR {Number(schedule.total_amount).toLocaleString()}</div>
                        <div style={{ fontSize:12, color:'var(--gray)' }}>{schedule.paid_count}/{schedule.installments} paid · {schedule.status}</div>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10 }}>
                      {items.map((item) => {
                        const payUrl = `${appUrl}/pay/${item.token}`;
                        return (
                          <div key={item.token} style={{ background:'var(--dark3)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                              <strong style={{ fontSize:13 }}>Installment {item.installment_num}</strong>
                              <span style={{ fontSize:11, color:'var(--gray)', textTransform:'capitalize' }}>{item.status}</span>
                            </div>
                            <div style={{ fontSize:16, color:'#3D7FFF', fontFamily:'var(--font-head)', marginBottom:6 }}>PKR {Number(item.amount).toLocaleString()}</div>
                            <div style={{ fontSize:11, color:'var(--gray)', marginBottom:12 }}>Due {new Date(item.due_date).toLocaleDateString('en-PK')}</div>
                            <div style={{ display:'flex', gap:8 }}>
                              <a href={payUrl} target="_blank" style={{ flex:1, background:'rgba(0,82,255,0.08)', border:'1px solid rgba(0,82,255,0.2)', color:'#3D7FFF', padding:'7px 10px', borderRadius:7, fontSize:11, textDecoration:'none', textAlign:'center' }}>Open</a>
                              <div style={{ flex:1 }}><CopyScheduleLinkBtn url={payUrl} /></div>
                            </div>
                          </div>
                        );
                      })}
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

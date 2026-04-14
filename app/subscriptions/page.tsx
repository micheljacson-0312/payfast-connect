import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

interface Sub {
  id: number;
  contact_id: string;
  pf_token: string;
  payer_email: string;
  amount: number;
  frequency: string;
  status: string;
  next_billing: string;
  cycles_count: number;
  created_at: string;
}

export default async function SubscriptionsPage() {
  const session = await getSession();
  if (!session) redirect('/install');

  const subs = await query<Sub[]>(
    `SELECT * FROM subscriptions WHERE location_id = ? ORDER BY created_at DESC`,
    [session.locationId]
  );

  const statusColor = (s: string) => s === 'active'
    ? { bg: 'rgba(34,197,94,0.1)',  color: 'var(--success)' }
    : s === 'paused'
    ? { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }
    : { bg: 'rgba(239,68,68,0.1)',  color: 'var(--danger)' };

  const active   = subs.filter(s => s.status === 'active').length;
  const monthly  = subs.filter(s => s.status === 'active').reduce((a, s) => a + Number(s.amount), 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="resp-padding" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Subscriptions</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>{active} active · R {monthly.toFixed(2)} MRR</p>
        </div>

        <div className="resp-padding">
          {/* Stats */}
          <div className="resp-grid-auto" style={{ marginBottom: 24 }}>
            {[
              { label: 'Active', value: active, color: 'var(--success)' },
              { label: 'Total MRR', value: `R ${monthly.toFixed(2)}`, color: 'var(--blue-light)' },
              { label: 'Total Subscriptions', value: subs.length, color: 'white' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16, padding: '14px 24px', background: 'var(--dark3)', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: 760 }}>
              <div>Subscriber</div><div>Amount</div><div>Frequency</div><div>Status</div><div>Next Billing</div>
            </div>

            {subs.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>No subscriptions yet.</div>
            )}

            {subs.map(s => {
              const sc = statusColor(s.status);
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16, padding: '15px 24px', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center', minWidth: 760 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{s.payer_email}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'monospace' }}>{s.pf_token.slice(0, 16)}…</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, color: 'var(--success)' }}>R {Number(s.amount).toFixed(2)}</div>
                  <div style={{ color: 'var(--gray)', fontSize: 12, textTransform: 'capitalize' }}>{s.frequency}</div>
                  <div>
                    <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ color: 'var(--gray)', fontSize: 12 }}>
                    {s.next_billing ? new Date(s.next_billing).toLocaleDateString('en-ZA') : '—'}
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

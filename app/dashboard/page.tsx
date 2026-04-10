import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query, Installation, Payment } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect('/install');
  if (session.installMode === 'agency') redirect('/agency');

  const sp = searchParams ? await searchParams : {};
  const restored = sp.restored === '1';

  const { locationId } = session;

  const [inst] = await query<Installation[]>(
    'SELECT * FROM installations WHERE location_id = ?',
    [locationId]
  );

  const stats = await query<{ total: number; count: number; success: number; failed: number }[]>(
    `SELECT
       COALESCE(SUM(amount),0)                                          AS total,
       COUNT(*)                                                          AS count,
       SUM(status = 'complete')                                         AS success,
       SUM(status = 'failed')                                           AS failed
     FROM payments WHERE location_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [locationId]
  );

  const subCount = await query<{ c: number }[]>(
    `SELECT COUNT(*) AS c FROM subscriptions WHERE location_id = ? AND status = 'active'`,
    [locationId]
  );

  const recent = await query<Payment[]>(
    `SELECT * FROM payments WHERE location_id = ? ORDER BY created_at DESC LIMIT 5`,
    [locationId]
  );

  const chartData = await query<{ day: string; revenue: number }[]>(
    `SELECT DATE(created_at) AS day, COALESCE(SUM(amount),0) AS revenue
     FROM payments WHERE location_id = ? AND status = 'complete'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
     GROUP BY DATE(created_at) ORDER BY day`,
    [locationId]
  );

  const s = stats[0];
  const successRate = s.count > 0 ? ((s.success / s.count) * 100).toFixed(1) : '0';
  const maxRevenue  = Math.max(...chartData.map(d => Number(d.revenue)), 1);

  const credsMissing = !inst?.merchant_id || !inst?.merchant_key;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Topbar */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Dashboard</h2>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
              {inst?.environment === 'sandbox' ? '🟡 Sandbox Mode' : '🟢 Live Mode'}
            </p>
          </div>
          <Link href="/payments/new" style={{ background: 'var(--blue)', color: 'white', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
            + New Payment Link
          </Link>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {restored && (
            <div style={{ background: 'rgba(0,82,255,0.08)', border: '1px solid rgba(0,82,255,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, color: '#7FB0FF', fontSize: 14 }}>
              Existing sub-account session restored successfully.
            </div>
          )}

          {/* Credentials warning */}
          {credsMissing && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--warning)' }}>⚠️ GoPayFast credentials not configured — payments won&apos;t work yet.</span>
              <Link href="/settings" style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>Go to Settings →</Link>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Revenue (30d)',   value: `R ${Number(s.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, color: 'var(--blue-light)' },
              { label: 'Payments (30d)',        value: String(s.count),     color: 'var(--success)' },
              { label: 'Active Subscriptions', value: String(subCount[0].c), color: 'white' },
              { label: 'Success Rate',         value: `${successRate}%`,   color: 'var(--warning)' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Chart + Recent */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Bar chart */}
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Revenue — Last 14 Days</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 20 }}>Completed payments only</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                {chartData.length === 0
                  ? <div style={{ color: 'var(--gray)', fontSize: 13, alignSelf: 'center', width: '100%', textAlign: 'center' }}>No data yet</div>
                  : chartData.map(d => (
                      <div key={d.day} title={`R ${d.revenue} · ${d.day}`} style={{
                        flex: 1, background: 'var(--blue)', borderRadius: '4px 4px 0 0',
                        height: `${Math.max((Number(d.revenue) / maxRevenue) * 100, 4)}%`,
                        minHeight: 4, opacity: 0.85, cursor: 'pointer', transition: 'opacity .2s',
                      }} />
                    ))
                }
              </div>
            </div>

            {/* Recent */}
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Payments</div>
              {recent.length === 0
                ? <div style={{ color: 'var(--gray)', fontSize: 13 }}>No payments yet</div>
                : recent.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 500 }}>{p.payer_first} {p.payer_last}</div>
                        <div style={{ color: 'var(--gray)', fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: p.status === 'complete' ? 'var(--success)' : p.status === 'failed' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                        R {Number(p.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
              }
              <Link href="/payments" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'var(--blue-light)', marginTop: 16 }}>
                View all →
              </Link>
            </div>
          </div>

          {/* ITN Webhook info */}
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Your GoPayFast ITN Webhook URL</div>
            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 12 }}>
              Add this URL in your GoPayFast dashboard as the payment callback / notification URL.
            </div>
            <div style={{ background: 'var(--dark3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <code style={{ fontSize: 13, color: 'var(--blue-light)', fontFamily: 'monospace' }}>
                {process.env.NEXT_PUBLIC_APP_URL}/api/payfast/itn
              </code>
              <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', padding: '3px 10px', borderRadius: 6 }}>Active</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

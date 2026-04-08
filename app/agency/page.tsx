import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import AgencyControls from './AgencyControls';

export default async function AgencyPage() {
  const session = await getSession();
  if (!session) redirect('/agency/install');
  if (session.installMode !== 'agency') redirect('/dashboard');

  const stats = await query<any[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END),0) AS mrr,
       SUM(status = 'active') AS active_count,
       SUM(status = 'trial') AS trial_count,
       SUM(status = 'suspended') AS suspended_count
     FROM location_subscriptions`
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', color: 'white', padding: '28px 32px', fontFamily: 'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800 }}>Agency Dashboard</h1>
          <p style={{ color: 'var(--gray)', marginTop: 8 }}>Separate view for the agency marketplace app. Manage revenue, billing settings, and client subscription health from here.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
          {[
            ['MRR', `PKR ${Number(stats[0]?.mrr || 0).toLocaleString()}`],
            ['Active Clients', stats[0]?.active_count || 0],
            ['Trials', stats[0]?.trial_count || 0],
            ['Suspended', stats[0]?.suspended_count || 0],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
              <div style={{ color: 'var(--gray)', fontSize: 12, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            ['/admin/billing', 'Agency Billing Panel', 'Open client-level billing records and internal overrides.'],
            ['/agency/install', 'Agency Install Flow', 'Use the dedicated marketplace install URL for the agency app.'],
            ['/docs', 'Documentation', 'Open the current docs and reference files for this project.'],
          ].map(([href, title, desc]) => (
            <a key={href} href={href} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, textDecoration: 'none', color: 'white' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ color: 'var(--gray)', fontSize: 13 }}>{desc}</div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>HighLevel SaaS Controls</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Use these tools to inspect agency plans, inspect sub-account SaaS subscriptions, and send rebilling / enable / update / pause requests directly against the connected agency context.</div>
          </div>
          <AgencyControls />
        </div>
      </div>
    </div>
  );
}

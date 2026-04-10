import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import AgencyControls from './AgencyControls';
import AgencyPayfastSettings from './AgencyPayfastSettings';

export default async function AgencyPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect('/agency/install');
  if (session.installMode !== 'agency') redirect('/dashboard');

  const sp = searchParams ? await searchParams : {};
  const installed = sp.installed === '1';
  const restored = sp.restored === '1';

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

        {(installed || restored) && (
          <div style={{ background: 'rgba(0,82,255,0.08)', border: '1px solid rgba(0,82,255,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 22, color: '#7FB0FF', fontSize: 14 }}>
            {installed ? 'Agency app connected successfully.' : 'Existing agency session restored successfully.'}
          </div>
        )}

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
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Agency PayFast Setup</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Connect your own PayFast credentials before creating agency invoices or collecting agency-level payments.</div>
          </div>
          <AgencyPayfastSettings />
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>HighLevel SaaS Controls</div>
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>Use these tools to inspect agency plans, inspect sub-account SaaS subscriptions, and send rebilling / enable / update / pause requests directly against the connected agency context.</div>
          </div>
          <AgencyControls initialLocationId={session.locationId} />
        </div>
      </div>
    </div>
  );
}

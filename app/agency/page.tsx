import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { getAgencySettings } from '@/lib/billing';
import AgencyDashboardClient from './AgencyDashboardClient';

export default async function AgencyPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect('/agency/install');
  if (session.installMode !== 'agency') redirect('/dashboard');

  const sp = searchParams ? await searchParams : {};
  const installed = sp.installed === '1';
  const restored = sp.restored === '1';
  const agencySettings = await getAgencySettings();
  const payfastReady = Boolean(agencySettings?.merchant_id && agencySettings?.merchant_key);

  const stats = await query<any[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END),0) AS mrr,
       SUM(status = 'active') AS active_count,
       SUM(status = 'trial') AS trial_count,
       SUM(status = 'suspended') AS suspended_count
     FROM location_subscriptions`
  );

  return <AgencyDashboardClient stats={stats[0] || { mrr: 0, active_count: 0, trial_count: 0, suspended_count: 0 }} sessionLocationId={session.locationId} installed={installed} restored={restored} payfastReady={payfastReady} />;
}

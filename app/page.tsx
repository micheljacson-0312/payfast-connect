import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { checkSubscription } from '@/lib/billing';

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    if (session.installMode === 'agency') redirect('/agency');
    const billing = await checkSubscription(session.locationId);
    if (billing.isSuspended) redirect('/billing/suspended');
    if (billing.needsPlanSelection) redirect('/billing/plans');
    redirect('/dashboard');
  }
  else redirect('/install');
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    if (session.installMode === 'agency') redirect('/agency');
    redirect('/dashboard');
  }
  else redirect('/install');
}

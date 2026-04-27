import { NextRequest, NextResponse } from 'next/server';
import { getAgencyContext } from '@/lib/ghl-saas';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 });

  const session = await getSession();
  if (!session || session.installMode !== 'agency') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // only allow agency to fetch locations under their company
  const inst = await query<any[]>('SELECT company_id FROM installations WHERE location_id = ? LIMIT 1', [session.locationId]);
  const companyFromInst = inst[0]?.company_id;
  if (companyFromInst) {
    const target = await query<any[]>('SELECT company_id FROM installations WHERE location_id = ? LIMIT 1', [locationId]);
    if (!target.length || String(target[0].company_id) !== String(companyFromInst)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const ctx = await getAgencyContext(session.locationId);
  if (!ctx || !ctx.accessToken) return NextResponse.json({ error: 'Unauthorized or missing agency token' }, { status: 401 });

  const q = request.nextUrl.searchParams;
  const qs: Record<string, string> = {};
  for (const [k, v] of q.entries()) qs[k] = v;

  try {
    const url = `/blade-platform/transactions/LOCATION/${encodeURIComponent(locationId)}${qs && Object.keys(qs).length ? `?${new URLSearchParams(qs).toString()}` : ''}`;
    const res = await fetch(`https://services.leadconnectorhq.com${url}`, {
      headers: { Authorization: `Bearer ${ctx.accessToken}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) return NextResponse.json({ error: data?.message || text || 'Request failed' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

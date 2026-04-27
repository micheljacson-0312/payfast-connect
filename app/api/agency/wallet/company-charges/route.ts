import { NextRequest, NextResponse } from 'next/server';
import { getAgencyContext } from '@/lib/ghl-saas';

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  const ctx = await getAgencyContext(request.headers.get('x-location-id') || '');
  if (!ctx || !ctx.accessToken) return NextResponse.json({ error: 'Unauthorized or missing agency token' }, { status: 401 });

  const q = request.nextUrl.searchParams;
  const qs: Record<string, string> = {};
  for (const [k, v] of q.entries()) qs[k] = v;

  try {
    const url = `/warehouse/v2/usage-records/LocationChargesInCompanyWallet/${encodeURIComponent(qs['locationId'] || '')}?companyId=${encodeURIComponent(companyId)}${qs && Object.keys(qs).length ? `&${new URLSearchParams(qs).toString()}` : ''}`;
    const res = await fetch(`https://backend.leadconnectorhq.com${url}`, {
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

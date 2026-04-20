import { NextRequest, NextResponse } from 'next/server';
import { ensureCustomProviderProvisioned } from '@/lib/ghl-provider';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locationId = String(body.locationId || session.locationId || '').trim();

  if (!locationId) {
    return NextResponse.json({ error: 'locationId required' }, { status: 400 });
  }

  const result = await ensureCustomProviderProvisioned(locationId, {
    merchantId: body.merchantId || body.merchant_id || null,
    merchantKey: body.merchantKey || body.merchant_key || null,
    passphrase: body.passphrase || null,
    environment: body.environment || 'live',
  });

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { getAgencySettings } from '@/lib/billing';

export async function GET() {
  const session = await getSession();
  if (!session || session.installMode !== 'agency') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json((await getAgencySettings()) || null);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.installMode !== 'agency') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await query(
    `INSERT INTO agency_settings (id, merchant_id, merchant_key, merchant_name, store_id, passphrase, environment, grace_period_days, trial_days, notify_email)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       merchant_id = VALUES(merchant_id),
       merchant_key = VALUES(merchant_key),
       merchant_name = VALUES(merchant_name),
       store_id = VALUES(store_id),
       passphrase = VALUES(passphrase),
       environment = VALUES(environment),
       grace_period_days = VALUES(grace_period_days),
       trial_days = VALUES(trial_days),
       notify_email = VALUES(notify_email)`,
    [
      body.merchant_id || null,
      body.merchant_key || null,
      body.merchant_name || null,
      body.store_id || null,
      body.passphrase || null,
      body.environment || 'live',
      Number(body.grace_period_days || 3),
      Number(body.trial_days || 14),
      body.notify_email || null,
    ]
  );

  return NextResponse.json({ success: true });
}

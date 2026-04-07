import { NextRequest, NextResponse } from 'next/server';
import { query, Installation } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<Installation[]>(
    `SELECT merchant_id, merchant_key, passphrase, environment,
            tag_on_payment, tag_on_fail, move_opp_stage,
            auto_create_contact, fire_workflow
     FROM installations WHERE location_id = ?`,
    [session.locationId]
  );
  if (!rows.length) return NextResponse.json(null);
  const r = rows[0];
  return NextResponse.json({
    merchant_id:         r.merchant_id        || '',
    merchant_key:        r.merchant_key       || '',
    passphrase:          r.passphrase         || '',
    environment:         r.environment,
    tag_on_payment:      r.tag_on_payment,
    tag_on_fail:         r.tag_on_fail,
    move_opp_stage:      r.move_opp_stage,
    auto_create_contact: !!r.auto_create_contact,
    fire_workflow:       !!r.fire_workflow,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    merchant_id,
    merchant_key,
    passphrase,
    environment,
    tag_on_payment,
    tag_on_fail,
    move_opp_stage,
    auto_create_contact,
    fire_workflow,
  } = body;

  await query(
    `UPDATE installations SET
       merchant_id         = ?,
       merchant_key        = ?,
       passphrase          = ?,
       environment         = ?,
       tag_on_payment      = ?,
       tag_on_fail         = ?,
       move_opp_stage      = ?,
       auto_create_contact = ?,
       fire_workflow       = ?
     WHERE location_id = ?`,
    [
      merchant_id,
      merchant_key,
      passphrase || null,
      environment || 'live',
      tag_on_payment || 'paid,customer',
      tag_on_fail    || 'payment-failed',
      move_opp_stage || 'won',
      auto_create_contact ? 1 : 0,
      fire_workflow ? 1 : 0,
      session.locationId,
    ]
  );

  return NextResponse.json({ success: true });
}

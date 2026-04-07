import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { code, name, type, value, min_amount, max_uses, expires_at } = body;

  if (!code?.trim() || !value) {
    return NextResponse.json({ error: 'Code and value required' }, { status: 400 });
  }

  try {
    const result = await query<any>(
      `INSERT INTO coupons (location_id, code, name, type, value, min_amount, max_uses, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.locationId,
        code.trim().toUpperCase(),
        name || null,
        type || 'percent',
        parseFloat(value),
        parseFloat(min_amount || '0'),
        parseInt(max_uses || '0'),
        expires_at || null,
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('uniq_code')
      ? 'Coupon code already exists'
      : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

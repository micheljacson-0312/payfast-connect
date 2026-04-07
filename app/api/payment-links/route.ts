import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const token = generateToken(16);
  const productId = body.product_id ? parseInt(body.product_id) : null;

  let amount = body.amount ? parseFloat(body.amount) : null;
  if (!amount && productId) {
    const products = await query<any[]>('SELECT price FROM products WHERE id = ? AND location_id = ?', [productId, session.locationId]);
    amount = products[0] ? Number(products[0].price) : null;
  }

  await query(
    `INSERT INTO payment_links (
      location_id, token, name, description, product_id, amount, amount_type, currency, type, interval,
      max_uses, expires_at, collect_phone, collect_address, allow_coupon, success_redirect, tag_on_pay, ghl_pipeline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.locationId,
      token,
      body.name,
      body.description || null,
      productId,
      amount,
      body.amount_type || 'fixed',
      'PKR',
      body.type === 'subscription' ? 'subscription' : 'one_time',
      body.interval || 'monthly',
      parseInt(body.max_uses || '0'),
      body.expires_at || null,
      body.collect_phone ? 1 : 0,
      body.collect_address ? 1 : 0,
      body.allow_coupon ? 1 : 0,
      body.success_redirect || null,
      body.tag_on_pay || null,
      body.ghl_pipeline || null,
    ]
  );

  return NextResponse.json({ success: true, token });
}

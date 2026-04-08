import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const token = generateToken(16);
    const productId = body.product_id ? parseInt(body.product_id, 10) : null;
    const amountType = body.amount_type === 'custom' ? 'custom' : 'fixed';
    const paymentType = body.type === 'subscription' ? 'subscription' : 'one_time';

    let amount = body.amount ? parseFloat(body.amount) : null;
    if ((amount == null || Number.isNaN(amount)) && productId) {
      const products = await query<any[]>('SELECT price FROM products WHERE id = ? AND location_id = ?', [productId, session.locationId]);
      amount = products[0] ? Number(products[0].price) : null;
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Link name is required' }, { status: 400 });
    }

    if (amountType === 'fixed' && (amount == null || Number.isNaN(amount) || amount <= 0)) {
      return NextResponse.json({ error: 'A valid amount is required for fixed links' }, { status: 400 });
    }

    const expiresAt = body.expires_at
      ? new Date(body.expires_at).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await query(
      `INSERT INTO payment_links (
        location_id, token, name, description, product_id, amount, amount_type, currency, type, \`interval\`,
        max_uses, expires_at, collect_phone, collect_address, allow_coupon, success_redirect, tag_on_pay, ghl_pipeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.locationId,
        token,
        body.name.trim(),
        body.description || null,
        productId,
        amountType === 'custom' ? null : amount,
        amountType,
        'PKR',
        paymentType,
        body.interval || 'monthly',
        parseInt(body.max_uses || '0', 10),
        expiresAt,
        body.collect_phone ? 1 : 0,
        body.collect_address ? 1 : 0,
        body.allow_coupon ? 1 : 0,
        body.success_redirect || null,
        body.tag_on_pay || null,
        body.ghl_pipeline || null,
      ]
    );

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[payment-links:create]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create payment link' }, { status: 500 });
  }
}

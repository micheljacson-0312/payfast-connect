import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateSlug, generateToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Form title required' }, { status: 400 });
  }

  const token = generateToken(16);
  const slug = generateSlug(body.title);
  const productId = body.product_id ? parseInt(body.product_id) : null;

  let amount = body.amount ? parseFloat(body.amount) : null;
  if (!amount && productId) {
    const products = await query<any[]>('SELECT price FROM products WHERE id = ? AND location_id = ?', [productId, session.locationId]);
    amount = products[0] ? Number(products[0].price) : null;
  }

  await query(
    `INSERT INTO order_forms (
      location_id, slug, token, title, description, product_id, amount, currency, type,
      collect_name, collect_email, collect_phone, collect_address, button_text, success_message,
      success_redirect, tag_on_pay, pipeline_stage, allow_coupon
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.locationId,
      slug,
      token,
      body.title.trim(),
      body.description || null,
      productId,
      amount,
      body.currency || 'PKR',
      body.type === 'subscription' ? 'subscription' : 'one_time',
      body.collect_name ? 1 : 0,
      body.collect_email ? 1 : 0,
      body.collect_phone ? 1 : 0,
      body.collect_address ? 1 : 0,
      body.button_text || 'Pay Now',
      body.success_message || null,
      body.success_redirect || null,
      body.tag_on_pay || null,
      body.pipeline_stage || null,
      body.allow_coupon ? 1 : 0,
    ]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return NextResponse.json({ success: true, token, url: `${appUrl}/pay/${token}` });
}

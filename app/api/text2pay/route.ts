import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateToken } from '@/lib/tokens';
import { createGHLProduct, createGHLPrice } from '@/lib/ghl-products';
import { findGHLContactByPhone, sendGHLMessage } from '@/lib/ghl-conversations';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any[]>('SELECT * FROM text2pay WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { contact_name, phone, email, amount, description } = body;

    if (!phone?.trim() || !amount) {
      return NextResponse.json({ error: 'Phone and amount required' }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }

    // 1. Create a temporary GHL Product and Price for this specific request
    const product = await createGHLProduct(session.locationId, {
      name: `T2P: ${contact_name || 'Payment'}`,
      description: description || `Payment request for ${phone}`,
    });

    await createGHLPrice(session.locationId, product.id, {
      price: numericAmount,
      currency: 'PKR',
      type: 'one_time',
    });

    // GHL payment link is typically based on the Price ID. 
    // In a real scenario, we'd fetch the generated link from GHL or use a known pattern.
    const paymentLink = `https://link.msgsnd.com/pay/${product.id}`; // Mock GHL payment link pattern

    // 2. Find or create GHL contact to send SMS
    const contact = await findGHLContactByPhone(session.locationId, phone.trim());
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found in GHL. Please add them first.' }, { status: 404 });
    }

    // 3. Send SMS via GHL
    const message = `Hello ${contact_name || ''}, you have a payment request for PKR ${numericAmount}. Pay here: ${paymentLink}`;
    await sendGHLMessage(session.locationId, contact.id, message);

    // 4. Save locally
    const token = generateToken(16);
    const result = await query<any>(
      `INSERT INTO text2pay (location_id, contact_name, phone, email, amount, description, token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.locationId,
        contact_name || null,
        phone.trim(),
        email || null,
        numericAmount,
        description || null,
        token,
      ]
    );

    const rows = await query<any[]>('SELECT * FROM text2pay WHERE id = ?', [result.insertId]);
    return NextResponse.json({ ...rows[0], ghlProductId: product.id, paymentLink });
  } catch (error) {
    console.error('[text2pay:create]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create text2pay request' }, { status: 500 });
  }
}

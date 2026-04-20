import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createGHLProduct, createGHLPrice, getGHLProducts } from '@/lib/ghl-products';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Try to fetch from GHL first
    const ghlProducts = await getGHLProducts(session.locationId);
    
    // Still fetch local for legacy/fallback
    const localProducts = await query<any[]>('SELECT * FROM products WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
    
    return NextResponse.json({
      ghl: ghlProducts,
      local: localProducts
    });
  } catch (error: any) {
    // Fallback to local only if GHL fails
    const rows = await query<any[]>('SELECT * FROM products WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
    return NextResponse.json(rows);
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, price, type, interval, currency, is_active } = body;

  if (!name?.trim() || price == null || price === '') {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  try {
    // 1. Create in GHL
    const product = await createGHLProduct(session.locationId, { 
      name: name.trim(), 
      description: description || null 
    });
    
    // 2. Create Price in GHL
    await createGHLPrice(session.locationId, product.id, {
      price: parseFloat(price),
      currency: currency || 'PKR',
      type: type === 'recurring' ? 'recurring' : 'one_time',
      interval: interval === 'monthly' ? 'month' : interval === 'yearly' ? 'year' : undefined,
    });

    // 3. Still save locally for fast access/legacy
    const result = await query<any>(
      `INSERT INTO products (location_id, name, description, price, type, \`interval\`, currency, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.locationId,
        name.trim(),
        description || null,
        parseFloat(price),
        type || 'one_time',
        interval || 'monthly',
        currency || 'PKR',
        is_active ? 1 : 0,
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId, 
      ghlProductId: product.id 
    });
  } catch (error: any) {
    console.error('[products:create-ghl]', error);
    return NextResponse.json({ error: error.message || 'Failed to sync with GHL' }, { status: 500 });
  }
}

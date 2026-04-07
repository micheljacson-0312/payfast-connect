import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any[]>('SELECT * FROM products WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, price, type, interval, currency, is_active } = body;

  if (!name?.trim() || price == null || price === '') {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const result = await query<any>(
    `INSERT INTO products (location_id, name, description, price, type, interval, currency, is_active)
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

  return NextResponse.json({ success: true, id: result.insertId });
}

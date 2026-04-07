import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateToken } from '@/lib/tokens';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any[]>('SELECT * FROM text2pay WHERE location_id = ? ORDER BY created_at DESC', [session.locationId]);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { contact_name, phone, email, amount, description } = body;

  if (!phone?.trim() || !amount) {
    return NextResponse.json({ error: 'Phone and amount required' }, { status: 400 });
  }

  const token = generateToken(16);
  const result = await query<any>(
    `INSERT INTO text2pay (location_id, contact_name, phone, email, amount, description, token)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.locationId,
      contact_name || null,
      phone.trim(),
      email || null,
      parseFloat(amount),
      description || null,
      token,
    ]
  );

  const rows = await query<any[]>('SELECT * FROM text2pay WHERE id = ?', [result.insertId]);
  return NextResponse.json(rows[0]);
}

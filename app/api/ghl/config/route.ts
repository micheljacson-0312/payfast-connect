import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET — load existing config for a location
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 });

  const rows = await query<any[]>(
    `SELECT merchant_id, merchant_key, passphrase, environment
     FROM installations WHERE location_id = ?`,
    [locationId]
  );

  if (!rows.length) return NextResponse.json({});

  return NextResponse.json({
    merchant_id:  rows[0].merchant_id  || '',
    merchant_key: rows[0].merchant_key || '',
    passphrase:   rows[0].passphrase   || '',
    environment:  rows[0].environment  || 'live',
  });
}

// POST — save config from CRM config iframe
export async function POST(request: NextRequest) {
  const { locationId, merchant_id, merchant_key, passphrase, environment } = await request.json();

  if (!locationId)   return NextResponse.json({ error: 'locationId required' }, { status: 400 });
  if (!merchant_id)  return NextResponse.json({ error: 'merchant_id required' }, { status: 400 });
  if (!merchant_key) return NextResponse.json({ error: 'merchant_key required' }, { status: 400 });

  // Check if installation exists — it should from OAuth
  const exists = await query<any[]>(
    'SELECT id FROM installations WHERE location_id = ?',
    [locationId]
  );

  if (exists.length) {
    await query(
      `UPDATE installations
       SET merchant_id = ?, merchant_key = ?, passphrase = ?, environment = ?
       WHERE location_id = ?`,
      [merchant_id, merchant_key, passphrase || null, environment || 'live', locationId]
    );
  } else {
    // Fallback: create minimal installation row
    await query(
      `INSERT INTO installations (location_id, merchant_id, merchant_key, passphrase, environment, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?, '', '', NOW())
       ON DUPLICATE KEY UPDATE merchant_id=VALUES(merchant_id), merchant_key=VALUES(merchant_key)`,
      [locationId, merchant_id, merchant_key, passphrase || null, environment || 'live']
    );
  }

  return NextResponse.json({ success: true });
}

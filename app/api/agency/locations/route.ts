import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.installMode !== 'agency') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await query<any[]>(
    `SELECT location_id, merchant_name
     FROM installations
     ORDER BY COALESCE(merchant_name, location_id) ASC`
  );

  return NextResponse.json(
    rows.map((row) => ({
      locationId: row.location_id,
      name: row.merchant_name || row.location_id,
    }))
  );
}

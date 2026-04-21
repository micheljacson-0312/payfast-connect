import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.installMode !== 'agency') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await query<any[]>(
    `SELECT
       i.location_id,
       i.merchant_name,
       ma.business_name,
       ma.status AS application_status
     FROM installations i
     LEFT JOIN merchant_applications ma ON ma.ghl_location_id = i.location_id
     ORDER BY COALESCE(ma.business_name, i.merchant_name, i.location_id) ASC`
  );

  return NextResponse.json(
    rows.map((row) => ({
      locationId: row.location_id,
      name: row.business_name || row.merchant_name || row.location_id,
      businessName: row.business_name || '',
      merchantName: row.merchant_name || '',
      status: row.application_status || '',
    }))
  );
}

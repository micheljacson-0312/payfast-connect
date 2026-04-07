import mysql, { type FieldPacket, type QueryResult } from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:            process.env.DB_HOST!,
      port:            parseInt(process.env.DB_PORT || '3306'),
      user:            process.env.DB_USER!,
      password:        process.env.DB_PASSWORD!,
      database:        process.env.DB_NAME!,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit:      0,
      timezone:        '+00:00',
    });
  }
  return pool;
}

// mysql2 accepts these primitive types as query values
type SqlValue = string | number | boolean | null | Date | Buffer;

export async function query<T = unknown>(
  sql: string,
  values?: SqlValue[]
): Promise<T> {
  const db = getPool();
  const [rows]: [QueryResult, FieldPacket[]] = await db.execute(sql, values);
  return rows as T;
}

// ─── Type helpers ───────────────────────────────────────────
export interface Installation {
  id: number;
  location_id: string;
  company_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  merchant_id: string | null;
  merchant_key: string | null;
  passphrase: string | null;
  environment: 'live' | 'sandbox';
  tag_on_payment: string;
  tag_on_fail: string;
  move_opp_stage: string;
  auto_create_contact: number;
  fire_workflow: number;
  created_at: string;
}

export interface Payment {
  id: number;
  location_id: string;
  pf_payment_id: string;
  pf_token: string | null;
  contact_id: string | null;
  payer_email: string;
  payer_first: string;
  payer_last: string;
  amount: number;
  item_name: string;
  payment_type: 'one-time' | 'subscription';
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  synced_ghl: number;
  created_at: string;
}

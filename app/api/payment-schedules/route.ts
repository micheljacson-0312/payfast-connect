import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateToken } from '@/lib/tokens';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any[]>(
    `SELECT * FROM payment_schedules WHERE location_id = ? ORDER BY created_at DESC`,
    [session.locationId]
  );

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const totalAmount = Number(body.total_amount || 0);
  const installments = Number(body.installments || 0);

  if (!body.client_name?.trim() || !body.client_email?.includes('@') || totalAmount <= 0 || installments < 2) {
    return NextResponse.json({ error: 'Client, email, total amount, and at least 2 installments are required' }, { status: 400 });
  }

  const scheduleResult = await query<any>(
    `INSERT INTO payment_schedules (location_id, contact_id, client_name, client_email, total_amount, installments, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.locationId,
      body.contact_id || null,
      body.client_name.trim(),
      body.client_email.trim(),
      totalAmount,
      installments,
      body.description || null,
    ]
  );

  const scheduleId = scheduleResult.insertId;
  const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
  const items = [];

  for (let index = 0; index < installments; index += 1) {
    const installmentNum = index + 1;
    const remainder = Number((totalAmount - baseAmount * (installments - 1)).toFixed(2));
    const amount = installmentNum === installments ? remainder : Number(baseAmount.toFixed(2));
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + index);
    const token = generateToken(16);

    await query(
      `INSERT INTO schedule_installments (schedule_id, installment_num, amount, due_date, token, status)
       VALUES (?, ?, ?, ?, ?, 'sent')`,
      [scheduleId, installmentNum, amount, dueDate.toISOString().split('T')[0], token]
    );

    items.push({ installment_num: installmentNum, amount, due_date: dueDate.toISOString().split('T')[0], token });
  }

  return NextResponse.json({ success: true, id: scheduleId, installments: items });
}

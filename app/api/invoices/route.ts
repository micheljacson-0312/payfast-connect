import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateInvoiceNumber, generateToken } from '@/lib/tokens';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.client_name?.trim() || !body.client_email?.includes('@')) {
    return NextResponse.json({ error: 'Client name and valid email required' }, { status: 400 });
  }

  const token = generateToken(16);
  const invoiceNumber = generateInvoiceNumber(session.locationId);
  const status = body.send_now ? 'sent' : 'draft';

  const result = await query<any>(
    `INSERT INTO invoices (
      location_id, invoice_number, token, client_name, client_email, client_phone, client_address,
      title, notes, terms, issue_date, due_date, subtotal, discount_type, discount_value,
      discount_amount, tax_rate, tax_amount, total, mode, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.locationId,
      invoiceNumber,
      token,
      body.client_name.trim(),
      body.client_email.trim(),
      body.client_phone || null,
      body.client_address || null,
      body.title || 'Invoice',
      body.mode === 'simple' ? body.simple_description || body.notes || null : body.notes || null,
      body.terms || null,
      body.issue_date,
      body.due_date || null,
      Number(body.subtotal || 0),
      body.discount_type || 'percent',
      Number(body.discount_value || 0),
      Number(body.discount_amount || 0),
      Number(body.tax_rate || 0),
      Number(body.tax_amount || 0),
      Number(body.total || 0),
      body.mode || 'line_items',
      status,
    ]
  );

  const invoiceId = result.insertId;
  if (body.mode === 'line_items' && Array.isArray(body.items)) {
    for (const item of body.items) {
      if (!item.name?.trim()) continue;

      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      await query(
        `INSERT INTO invoice_items (invoice_id, name, description, quantity, unit_price, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.name.trim(), item.description || null, quantity, unitPrice, quantity * unitPrice]
      );
    }
  }

  return NextResponse.json({ success: true, id: invoiceId, token });
}

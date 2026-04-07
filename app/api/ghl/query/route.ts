import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// CRM sends various queries here:
// - verify: confirm payment status
// - refund: process refund
// - subscription_cancel: cancel subscription

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, locationId, ghlTransactionId, chargeId, amount } = body;

  console.log('[CRM Query]', type, { locationId, ghlTransactionId, chargeId });

  switch (type) {

    // ── Verify Payment ──────────────────────────────────────
    case 'verify': {
      const rows = await query<any[]>(
        `SELECT * FROM payments WHERE (pf_payment_id = ? OR custom_str3 = ?) AND location_id = ? LIMIT 1`,
        [chargeId, ghlTransactionId, locationId]
      );

      if (!rows.length) {
        return NextResponse.json({ status: 'pending', message: 'Payment not found yet' });
      }

      const p = rows[0];
      return NextResponse.json({
        status:  p.status === 'complete' ? 'succeeded' : p.status === 'failed' ? 'failed' : 'pending',
        chargeId: p.pf_payment_id,
        amount:   p.amount,
        chargedAt: new Date(p.created_at).getTime() / 1000,
      });
    }

    // ── Refund ───────────────────────────────────────────────
    case 'refund': {
      // GoPayFast refunds are done via their dashboard manually
      // We mark it in our DB and notify CRM
      await query(
        `UPDATE payments SET status = 'refunded' WHERE pf_payment_id = ? AND location_id = ?`,
        [chargeId, locationId]
      );

      // GoPayFast does not have a programmatic refund API — must be done manually
      // Return success so CRM records it, then do manual refund in GoPayFast dashboard
      return NextResponse.json({
        success: true,
        message: 'Refund recorded. Please process manually in GoPayFast dashboard.',
        chargeId,
        refundAmount: amount,
      });
    }

    // ── List Payment Methods (for saved cards) ─────────────
    case 'list_payment_methods': {
      // GoPayFast doesn't support saved cards — return empty
      return NextResponse.json({ paymentMethods: [] });
    }

    // ── Default ──────────────────────────────────────────────
    default:
      return NextResponse.json({ error: 'Unknown query type' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  // CRM may send GET for health check
  return NextResponse.json({ status: 'ok', provider: 'GoPayFast by 10x Digital Ventures' });
}

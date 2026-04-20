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

    case 'ContactUpdate':
    case 'OpportunityCreate':
    case 'OpportunityUpdate':
    case 'OpportunityStatusUpdate':
    case 'InvoiceCreate':
    case 'InvoiceSent':
    case 'InvoiceUpdate':
    case 'ContactTagUpdate': {
      return NextResponse.json({ success: true, type, locationId });
    }

    case 'INSTALL': {
      if (!locationId) {
        return NextResponse.json({ error: 'locationId required' }, { status: 400 });
      }

      await query(
        `INSERT INTO installations (location_id, access_token, refresh_token, expires_at)
         VALUES (?, '', '', NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [locationId]
      );

      return NextResponse.json({ success: true, locationId });
    }

    case 'UNINSTALL': {
      if (!locationId) {
        return NextResponse.json({ error: 'locationId required' }, { status: 400 });
      }

      await query('DELETE FROM installations WHERE location_id = ?', [locationId]);
      return NextResponse.json({ success: true, locationId });
    }

    // ── Verify Payment ──────────────────────────────────────
    case 'verify': {
      const rows = await query<any[]>(
        `SELECT * FROM payments WHERE (pf_payment_id = ? OR custom_str3 = ?) AND location_id = ? LIMIT 1`,
        [chargeId, ghlTransactionId, locationId]
      );

      if (!rows.length) {
        return NextResponse.json({ success: false });
      }

      const p = rows[0];
      return NextResponse.json({
        success: p.status === 'complete',
        failed: p.status === 'failed',
      });
    }

    // ── Refund ───────────────────────────────────────────────
    case 'refund': {
      await query(
        `UPDATE payments SET status = 'refunded' WHERE pf_payment_id = ? AND location_id = ?`,
        [chargeId, locationId]
      );

      return NextResponse.json({
        success: true,
        message: 'Refund recorded. Please process manually in GoPayFast dashboard.',
        chargeId,
        refundAmount: amount,
      });
    }

    // ── List Payment Methods (for saved cards) ─────────────
    case 'list_payment_methods': {
      // GoPayFast doesn't support saved cards
      return NextResponse.json([]);
    }

    // ── Charge Payment Method (for saved cards) ─────────────
    case 'charge_payment': {
      return NextResponse.json({ 
        success: false, 
        message: 'Saved card payments not supported by this provider' 
      }, { status: 400 });
    }

    // ── Default ──────────────────────────────────────────────
    default:
      return NextResponse.json({ error: 'Unknown query type' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', provider: 'GoPayFast by 10x Digital Ventures' });
}

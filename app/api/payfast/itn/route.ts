import { NextRequest, NextResponse } from 'next/server';
import { query, Installation } from '@/lib/db';
import { verifySignature, PAYFAST_VALID_IPS } from '@/lib/payfast';
import { handlePaymentSync } from '@/lib/ghl';
import { parsePublicPayMeta } from '@/lib/public-pay';

export async function POST(request: NextRequest) {
  const ip   = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const body = await request.text();
  const itn  = Object.fromEntries(new URLSearchParams(body).entries());

  console.log('[ITN] IP:', ip, '| PF Payment ID:', itn.pf_payment_id);

  const locationId = itn.custom_str2;
  if (!locationId) return new NextResponse('Missing location', { status: 400 });

  const rows = await query<Installation[]>('SELECT * FROM installations WHERE location_id = ?', [locationId]);
  if (!rows.length) return new NextResponse('Not found', { status: 404 });
  const inst = rows[0];

  if (inst.environment === 'live' && PAYFAST_VALID_IPS.length > 2 && !PAYFAST_VALID_IPS.includes(ip)) {
    console.warn('[ITN] Invalid IP:', ip);
    return new NextResponse('Invalid IP', { status: 403 });
  }

  if (!verifySignature(itn, inst.passphrase)) {
    console.warn('[ITN] Signature mismatch');
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const status         = itn.payment_status?.toLowerCase();
  const isComplete     = status === 'complete';
  const isSubscription = !!itn.token;
  const sourceMeta     = parsePublicPayMeta(itn.custom_str4);

  // custom_str3 = ghlTransactionId (CRM-originated payments only)
  const ghlTransactionId = itn.custom_str3 || null;
  const contactId        = !ghlTransactionId ? (itn.custom_str1 || null) : null;

  let crmPaymentMeta: { invoiceId?: string | null; orderId?: string | null; contactId?: string | null } | null = null;
  if (ghlTransactionId) {
    const crmRows = await query<any[]>(
      `SELECT contact_id, item_description
       FROM payments
       WHERE custom_str3 = ? AND location_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [ghlTransactionId, locationId]
    );

    if (crmRows[0]) {
      try {
        crmPaymentMeta = crmRows[0].item_description ? JSON.parse(crmRows[0].item_description) : null;
      } catch {
        crmPaymentMeta = null;
      }

      if (!crmPaymentMeta) {
        crmPaymentMeta = { contactId: crmRows[0].contact_id || null };
      } else if (!crmPaymentMeta.contactId && crmRows[0].contact_id) {
        crmPaymentMeta.contactId = crmRows[0].contact_id;
      }
    }
  }

  // Upsert payment record
  await query(
    `INSERT INTO payments
       (location_id,pf_payment_id,pf_token,contact_id,payer_email,payer_first,payer_last,
        amount,item_name,payment_type,status,custom_str1,custom_str2,custom_str3,raw_itn)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       status=VALUES(status),raw_itn=VALUES(raw_itn),
       pf_payment_id=VALUES(pf_payment_id),updated_at=NOW()`,
    [
      locationId, itn.pf_payment_id, itn.token||null, contactId,
      itn.email_address, itn.name_first, itn.name_last,
      parseFloat(itn.amount_gross||'0'), itn.item_name,
      isSubscription?'subscription':'one-time',
      isComplete?'complete':status==='failed'?'failed':'pending',
      itn.custom_str1, itn.custom_str2, ghlTransactionId,
      JSON.stringify(itn),
    ]
  );

  if (isComplete) {
    if (ghlTransactionId) {
      // ── CRM-originated: notify CRM that payment succeeded ──
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ghl/notify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId, ghlTransactionId,
          chargeId:  itn.pf_payment_id,
          amount:    itn.amount_gross,
          contactId: crmPaymentMeta?.contactId || null,
          invoiceId: crmPaymentMeta?.invoiceId || null,
          eventType: isSubscription ? 'subscription.charged' : 'payment.captured',
        }),
      }).catch(e => console.error('[ITN→CRM Notify]', e));
    } else {
      // ── Our app-originated: update CRM contact directly ──
      const tags = (inst.tag_on_payment||'paid,customer').split(',').map(t=>t.trim()).filter(Boolean);
      const ghlId = await handlePaymentSync({
        locationId, email:itn.email_address, firstName:itn.name_first, lastName:itn.name_last,
        contactId:contactId||undefined, tags, oppStatus:inst.move_opp_stage||'won',
        autoCreate:!!inst.auto_create_contact,
      });
      if (ghlId) {
        await query('UPDATE payments SET synced_ghl=1,contact_id=? WHERE pf_payment_id=?', [ghlId, itn.pf_payment_id]);
      }

      if (sourceMeta) {
        if (sourceMeta.kind === 'payment_link') {
          await query('UPDATE payment_links SET uses_count = uses_count + 1 WHERE id = ?', [sourceMeta.id]);
        }

        if (sourceMeta.kind === 'text2pay') {
          await query(
            `UPDATE text2pay SET status = 'paid', paid_at = NOW(), pf_payment_id = ? WHERE id = ?`,
            [itn.pf_payment_id, sourceMeta.id]
          );
        }

        if (sourceMeta.kind === 'invoice') {
          await query(
            `UPDATE invoices SET status = 'paid', paid_at = NOW(), pf_payment_id = ? WHERE id = ?`,
            [itn.pf_payment_id, sourceMeta.id]
          );
        }

        if (sourceMeta.kind === 'order_form') {
          await query('UPDATE order_forms SET submissions = submissions + 1 WHERE id = ?', [sourceMeta.id]);
        }

        if (sourceMeta.kind === 'schedule_installment') {
          await query(
            `UPDATE schedule_installments
             SET status = 'paid', paid_at = NOW(), pf_payment_id = ?
             WHERE id = ?`,
            [itn.pf_payment_id, sourceMeta.id]
          );

          const scheduleRows = await query<any[]>(
            `SELECT schedule_id FROM schedule_installments WHERE id = ? LIMIT 1`,
            [sourceMeta.id]
          );

          if (scheduleRows[0]) {
            const scheduleId = scheduleRows[0].schedule_id;
            await query(
              `UPDATE payment_schedules ps
               JOIN (
                 SELECT schedule_id, COUNT(*) AS paid_count, COALESCE(SUM(amount), 0) AS amount_paid
                 FROM schedule_installments
                 WHERE schedule_id = ? AND status = 'paid'
               ) stats ON stats.schedule_id = ps.id
               SET ps.paid_count = stats.paid_count,
                   ps.amount_paid = stats.amount_paid,
                   ps.status = CASE WHEN stats.paid_count >= ps.installments THEN 'completed' ELSE ps.status END
               WHERE ps.id = ?`,
              [scheduleId, scheduleId]
            );
          }
        }

        if (sourceMeta.couponCode) {
          await query(
            'UPDATE coupons SET uses_count = uses_count + 1 WHERE location_id = ? AND code = ?',
            [locationId, sourceMeta.couponCode]
          );
        }
      }
    }

    if (isSubscription && itn.token) {
      await query(
        `INSERT INTO subscriptions (location_id,pf_token,payer_email,amount,status)
         VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE cycles_count=cycles_count+1,status='active'`,
        [locationId, itn.token, itn.email_address, parseFloat(itn.amount_gross||'0'), 'active']
      );
    }
  }

  return new NextResponse('OK', { status: 200 });
}

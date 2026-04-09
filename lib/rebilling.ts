import { query } from './db';
import { performTokenizedTransaction } from './payfast';

export async function processRebilling() {
  const now = new Date();
  
  // Find active subscriptions that are due for payment
  const dueSubscriptions = await query<any[]>(
    `SELECT ls.*, ap.price_monthly 
     FROM location_subscriptions ls
     JOIN agency_plans ap ON ls.plan_id = ap.id
     WHERE ls.status = 'active' 
     AND ls.current_period_end <= ? 
     AND ls.recurring_token IS NOT NULL`,
    [now]
  );

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const sub of dueSubscriptions) {
    try {
      // Use stored recurring_token to charge the customer
      const response = await performTokenizedTransaction({
        token: 'SYSTEM_TOKEN', // In reality, we'd use a system-level access token
        instrumentToken: sub.recurring_token,
        transactionId: `REBILL-${sub.location_id}-${Date.now()}`,
        merchantUserId: sub.location_id,
        userMobileNumber: 'SYSTEM', // As per API requirements
        basketId: `BASKET-${sub.location_id}-${Date.now()}`,
        orderDate: now.toISOString().slice(0, 19).replace('T', ' '),
        description: `Monthly subscription for ${sub.location_id}`,
        amount: sub.price_monthly,
        otp: 'RECURRING', // Recurring transactions don't need OTP
      });

      if (response.status_code === '00' || response.code === '00') {
        // Update subscription period
        const nextPeriodEnd = new Date();
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await query(
          'UPDATE location_subscriptions SET current_period_end = ? WHERE location_id = ?',
          [nextPeriodEnd, sub.location_id]
        );
        
        results.processed++;
      } else {
        results.failed++;
        results.errors.push({ locationId: sub.location_id, error: response.status_msg || response.message });
      }
    } catch (e: any) {
      results.failed++;
      results.errors.push({ locationId: sub.location_id, error: e.message });
    }
  }

  return results;
}

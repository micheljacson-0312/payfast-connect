import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { query, Payment } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/install');

  const { locationId } = session;
  const sp = await searchParams;
  const page    = parseInt(sp.page || '1');
  const perPage = 20;
  const offset  = (page - 1) * perPage;

  const statusFilter = sp.status;
  const typeFilter   = sp.type;

  let where = 'WHERE location_id = ?';
  const params: (string | number)[] = [locationId];

  if (statusFilter && statusFilter !== 'all') {
    where += ' AND status = ?';
    params.push(statusFilter);
  }
  if (typeFilter && typeFilter !== 'all') {
    where += ' AND payment_type = ?';
    params.push(typeFilter);
  }

  const payments = await query<Payment[]>(
    `SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, perPage, offset]
  );

  const [{ total }] = await query<{ total: number }[]>(
    `SELECT COUNT(*) AS total FROM payments ${where}`,
    params
  );

  const totalPages = Math.ceil(total / perPage);

  const statusColor = (s: string) => ({
    complete:  { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)' },
    failed:    { bg: 'rgba(239,68,68,0.1)',    color: 'var(--danger)' },
    pending:   { bg: 'rgba(245,158,11,0.1)',   color: 'var(--warning)' },
    cancelled: { bg: 'rgba(138,155,192,0.1)',  color: 'var(--gray)' },
  })[s] || { bg: 'transparent', color: 'var(--gray)' };

  const avatarColor = (n: string) => {
    const colors = ['#0052FF','#22C55E','#A78BFA','#F59E0B','#EF4444','#06B6D4'];
    return colors[(n.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Topbar */}
        <div className="resp-padding" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Payments</h2>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>{total} total transactions</p>
          </div>
          <Link href="/payments/new" style={{ background: 'var(--blue)', color: 'white', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
            + New Payment Link
          </Link>
        </div>

        <div className="resp-padding">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'All',        val: undefined },
              { label: 'Complete',   val: 'complete' },
              { label: 'Pending',    val: 'pending' },
              { label: 'Failed',     val: 'failed' },
            ].map(f => (
              <Link key={f.label} href={`/payments${f.val ? `?status=${f.val}` : ''}`}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  border: '1px solid var(--border)',
                  background: statusFilter === f.val || (!statusFilter && !f.val) ? 'rgba(0,82,255,0.1)' : 'transparent',
                  color:      statusFilter === f.val || (!statusFilter && !f.val) ? 'var(--blue-light)' : 'var(--gray)',
                  borderColor: statusFilter === f.val || (!statusFilter && !f.val) ? 'rgba(0,82,255,0.3)' : 'var(--border)',
                }}>
                {f.label}
              </Link>
            ))}
            <Link href="/payments?type=subscription"
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                border: '1px solid var(--border)',
                background: typeFilter === 'subscription' ? 'rgba(167,139,250,0.1)' : 'transparent',
                color:      typeFilter === 'subscription' ? '#A78BFA' : 'var(--gray)',
                borderColor: typeFilter === 'subscription' ? 'rgba(167,139,250,0.3)' : 'var(--border)',
              }}>
              Subscriptions
            </Link>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 800 }}>
                {/* Head */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 16, padding: '14px 24px', background: 'var(--dark3)', fontSize: 11, color: 'var(--gray)', letterSpacing: '0.5px', textTransform: 'uppercase', minWidth: 800 }}>
                  <div>Contact</div><div>Date</div><div>Amount</div><div>Type</div><div>Status</div><div>CRM Sync</div>
                </div>

                {payments.length === 0 && (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>
                    No payments found. <Link href="/payments/new" style={{ color: 'var(--blue-light)' }}>Create your first payment link →</Link>
                  </div>
                )}

                {payments.map(p => {
                  const sc = statusColor(p.status);
                  const initials = `${p.payer_first?.[0] || '?'}${p.payer_last?.[0] || ''}`.toUpperCase();
                  const ac = avatarColor(p.payer_first || '');
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: 16, padding: '15px 24px', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center', minWidth: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ac}22`, color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.payer_first} {p.payer_last}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)' }}>{p.payer_email}</div>
                        </div>
                      </div>
                      <div style={{ color: 'var(--gray)', fontSize: 12 }}>
                        {new Date(p.created_at).toLocaleDateString('en-ZA')}<br />
                        <span style={{ fontSize: 10 }}>{new Date(p.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, color: p.status === 'complete' ? 'var(--success)' : 'var(--gray)' }}>
                        R {Number(p.amount).toFixed(2)}
                      </div>
                      <div>
                        <span style={{ background: p.payment_type === 'subscription' ? 'rgba(167,139,250,0.1)' : 'rgba(0,82,255,0.1)', color: p.payment_type === 'subscription' ? '#A78BFA' : 'var(--blue-light)', padding: '3px 8px', borderRadius: 5, fontSize: 11 }}>
                          {p.payment_type === 'subscription' ? 'Sub' : 'One-time'}
                        </span>
                      </div>
                      <div>
                        <span style={{ background: sc.bg, color: sc.color, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11 }}>
                        {p.synced_ghl
                          ? <span style={{ background: 'rgba(255,107,44,0.1)', color: '#FF6B2C', padding: '3px 8px', borderRadius: 5 }}>✓ Synced</span>
                          : <span style={{ color: 'var(--gray)' }}>Not synced</span>
                        }
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                      Showing {offset + 1}–{Math.min(offset + perPage, total)} of {total}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {page > 1 && (
                        <Link href={`/payments?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', color: 'var(--gray)' }}>
                          ← Prev
                        </Link>
                      )}
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                        <Link key={n} href={`/payments?page=${n}${statusFilter ? `&status=${statusFilter}` : ''}`}
                          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', background: n === page ? 'var(--blue)' : 'transparent', color: n === page ? 'white' : 'var(--gray)', borderColor: n === page ? 'var(--blue)' : 'var(--border)' }}>
                          {n}
                        </Link>
                      ))}
                      {page < totalPages && (
                        <Link href={`/payments?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', color: 'var(--gray)' }}>
                          Next →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

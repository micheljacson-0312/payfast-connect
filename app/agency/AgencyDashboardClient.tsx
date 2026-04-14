'use client';

import { useMemo, useState } from 'react';
import AgencyControls from './AgencyControls';
import AgencyPayfastSettings from './AgencyPayfastSettings';
import type { WalletBalance } from '@/lib/wallet';
import type { PaymentInstrument } from '@/lib/payment-instruments';

type Stats = {
  mrr: number;
  active_count: number;
  trial_count: number;
  suspended_count: number;
};

type InvoiceRow = {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  plan_name: string | null;
  payment_id: string | null;
};

type AgencySettings = {
  merchant_name?: string | null;
  merchant_id?: string | null;
  store_id?: string | null;
  passphrase?: string | null;
  environment?: string | null;
  notify_email?: string | null;
};

export default function AgencyDashboardClient({
  stats,
  sessionLocationId,
  installed,
  restored,
  payfastReady,
  wallet,
  instruments,
  invoices,
  agencySettings,
}: {
  stats: Stats;
  sessionLocationId: string;
  installed: boolean;
  restored: boolean;
  payfastReady: boolean;
  wallet: WalletBalance;
  instruments: PaymentInstrument[];
  invoices: InvoiceRow[];
  agencySettings: AgencySettings | null;
}) {
  const [tab, setTab] = useState<'summary' | 'payments' | 'wallet' | 'notifications' | 'controls'>('summary');

  const overviewCards = useMemo(
    () => [
      { label: 'MRR', value: `PKR ${Number(stats.mrr || 0).toLocaleString()}`, tone: 'blue' },
      { label: 'Active Clients', value: stats.active_count || 0, tone: 'green' },
      { label: 'Trials', value: stats.trial_count || 0, tone: 'amber' },
      { label: 'Suspended', value: stats.suspended_count || 0, tone: 'red' },
    ],
    [stats]
  );

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'payments', label: 'Payments' },
    { id: 'wallet', label: 'Wallet & Transactions' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'controls', label: 'Controls' },
  ] as const;

  const tabButton = (active: boolean) => ({
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--blue-light)' : 'var(--gray)',
    borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
    padding: '12px 4px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  } as const);

  const maskedMerchantId = agencySettings?.merchant_id ? `${String(agencySettings.merchant_id).slice(0, 2)}••••${String(agencySettings.merchant_id).slice(-2)}` : 'Not connected';
  const primaryInstrument = instruments[0];

  return (
    <div className="page-shell-dark" style={{ padding: '28px 24px 40px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div className="page-container" style={{ maxWidth: 1280 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,82,255,0.12)', border: '1px solid rgba(0,82,255,0.22)', borderRadius: 999, padding: '7px 12px', color: '#7FB0FF', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              Agency Control Center
            </div>
            <h1 className="agency-hero-title" style={{ fontFamily: 'var(--font-head)', fontSize: 34, lineHeight: 1.05, fontWeight: 800, marginBottom: 10 }}>Billing Dashboard</h1>
            <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.75 }}>
              Manage subscriptions, wallet activity, and agency-level PayFast billing from a cleaner control surface.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 260, width: '100%', maxWidth: 360 }}>
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>Session</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{sessionLocationId}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Agency install is active</div>
            </div>
            <div style={{ background: payfastReady ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${payfastReady ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`, borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>PayFast</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: payfastReady ? '#22C55E' : '#F87171' }}>{payfastReady ? 'Connected' : 'Not connected'}</div>
            </div>
          </div>
        </div>

        {(installed || restored) && (
          <div style={{ background: 'rgba(0,82,255,0.10)', border: '1px solid rgba(0,82,255,0.22)', borderRadius: 14, padding: '14px 18px', marginBottom: 18, color: '#9BC2FF', fontSize: 14, lineHeight: 1.7 }}>
            {installed ? 'Agency app connected successfully.' : 'Existing agency session restored successfully.'}
          </div>
        )}

        <div className="mobile-stack-2" style={{ marginBottom: 18 }}>
          {overviewCards.map((card) => (
            <div key={card.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10 }}>{card.label}</div>
               <div style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: card.tone === 'green' ? '#22C55E' : card.tone === 'amber' ? '#FBBF24' : card.tone === 'red' ? '#F87171' : '#7FB0FF' }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 18, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={tabButton(tab === item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'summary' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div className="mobile-stack-2">
              <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Payment Method</span>
                  <button onClick={() => setTab('controls')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--gray)', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }} aria-label="Manage payment method">✎</button>
                </div>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize' }}>{agencySettings?.merchant_name || 'PayFast account not set'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>Merchant ID: {maskedMerchantId}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Store ID: {agencySettings?.store_id || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Environment: {agencySettings?.environment || 'live'}</div>
                </div>
              </div>

              <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>Tax Information</span>
                  <button onClick={() => setTab('notifications')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--gray)', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }} aria-label="Manage tax information">✎</button>
                </div>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 118, display: 'grid', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Billing contact</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>{agencySettings?.notify_email || 'No tax/contact email configured yet.'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>You can update this in Agency PayFast Setup.</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Billing Information</span>
                <button onClick={() => setTab('notifications')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--gray)', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' }}>Edit</button>
              </div>
              <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--gray)' }}>Session</span><span style={{ fontWeight: 700 }}>{sessionLocationId}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--gray)' }}>Primary payment</span><span style={{ fontWeight: 700 }}>{primaryInstrument ? `${primaryInstrument.instrument_alias || 'Saved card'} • ${primaryInstrument.card_last_four || '****'}` : 'None saved'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--gray)' }}>Wallet balance</span><span style={{ fontWeight: 700 }}>{wallet.currency} {Number(wallet.balance).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--gray)' }}>Billing status</span><span style={{ fontWeight: 700, color: payfastReady ? '#22C55E' : '#F87171' }}>{payfastReady ? 'Ready' : 'Locked until connected'}</span></div>
              </div>
            </div>

            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Payments History</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Keep track of your payments</div>
                </div>
                <button onClick={() => setTab('payments')} style={{ background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>Open table</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: 'var(--dark3)', color: 'var(--gray)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      <th style={{ textAlign: 'left', padding: '14px 20px' }}>Id</th>
                      <th style={{ textAlign: 'left', padding: '14px 20px' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '14px 20px' }}>Description</th>
                      <th style={{ textAlign: 'left', padding: '14px 20px' }}>Amount</th>
                      <th style={{ textAlign: 'left', padding: '14px 20px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 20, color: 'var(--gray)' }}>No payment history yet.</td>
                      </tr>
                    ) : invoices.slice(0, 5).map((invoice) => (
                      <tr key={invoice.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: 'var(--gray)' }}>#{invoice.id}</td>
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>{new Date(invoice.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 20px', minWidth: 220 }}>{invoice.plan_name || invoice.payment_id || 'Invoice payment'}</td>
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>PKR {Number(invoice.amount || 0).toLocaleString()}</td>
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: invoice.status === 'paid' ? '#22C55E' : invoice.status === 'failed' ? '#F87171' : '#FBBF24', fontWeight: 700 }}>{invoice.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Payment Method</div>
              <div style={{ color: 'var(--gray)', fontSize: 12, marginTop: 4 }}>Connected merchant and saved card details.</div>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 18 }}>
              <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Primary PayFast Account</span>
                  <span style={{ background: 'rgba(0,82,255,0.12)', color: '#7FB0FF', border: '1px solid rgba(0,82,255,0.22)', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{payfastReady ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div style={{ display: 'grid', gap: 10, color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>
                  <div>Merchant name: <span style={{ color: 'white' }}>{agencySettings?.merchant_name || '—'}</span></div>
                  <div>Merchant ID: <span style={{ color: 'white' }}>{maskedMerchantId}</span></div>
                  <div>Store ID: <span style={{ color: 'white' }}>{agencySettings?.store_id || '—'}</span></div>
                  <div>Environment: <span style={{ color: 'white' }}>{agencySettings?.environment || 'live'}</span></div>
                </div>
              </div>

              <div className="mobile-stack-2">
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tax Information</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>No tax ID declared. Use your agency settings to update billing contact details if needed.</div>
                </div>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Billing Information</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Wallet balance: <span style={{ color: 'white' }}>{wallet.currency} {Number(wallet.balance).toLocaleString()}</span></div>
                  <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Contact email: <span style={{ color: 'white' }}>{agencySettings?.notify_email || '—'}</span></div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Saved Payment Methods</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {instruments.length === 0 ? (
                    <div style={{ color: 'var(--gray)', fontSize: 13 }}>No saved cards yet.</div>
                  ) : instruments.map((item) => (
                    <div key={item.id} style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.instrument_alias || 'Saved card'} {item.card_last_four ? `•••• ${item.card_last_four}` : ''}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{item.expiry_date ? `Expires ${item.expiry_date}` : 'No expiry stored'}{item.is_default ? ' • Primary Card' : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Payments History</div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--dark3)', color: 'var(--gray)', fontSize: 11, textTransform: 'uppercase' }}>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Id</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Description</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Card</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '14px 16px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: 18, color: 'var(--gray)' }}>No invoices yet.</td></tr>
                      ) : invoices.map((invoice) => (
                        <tr key={invoice.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 16px', color: 'var(--gray)' }}>#{invoice.id}</td>
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{new Date(invoice.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px', minWidth: 200 }}>{invoice.plan_name || invoice.payment_id || 'Invoice payment'}</td>
                          <td style={{ padding: '14px 16px' }}>{primaryInstrument ? `${primaryInstrument.instrument_alias || 'Card'}${primaryInstrument.card_last_four ? ` •••• ${primaryInstrument.card_last_four}` : ''}` : '—'}</td>
                          <td style={{ padding: '14px 16px' }}>PKR {Number(invoice.amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: invoice.status === 'paid' ? '#22C55E' : invoice.status === 'failed' ? '#F87171' : '#FBBF24' }}>{invoice.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'wallet' && (
          <div className="mobile-stack-2">
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 4 }}>Your wallet balance</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800 }}>{wallet.currency} {Number(wallet.balance).toLocaleString()}</div>
                </div>
                <button onClick={() => setTab('payments')} style={{ background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>Details</button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Auto recharge</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Connect a payment method and configure recharge logic for the agency wallet.</div>
                </div>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Quick actions</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Use the billing tab to manage PayFast connection, then return here to review balances and receipts.</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Wallet Transactions</div>
              <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>Recent wallet-related billing records are shown below.</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {invoices.slice(0, 6).map((invoice) => (
                  <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{invoice.plan_name || 'Invoice payment'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{new Date(invoice.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>PKR {Number(invoice.amount || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="mobile-stack-2">
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Notification Recipients</div>
              <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>Add the people who should receive billing alerts.</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{agencySettings?.notify_email || 'No email configured'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>Default billing contact</div>
                  </div>
                  <div style={{ background: 'rgba(0,82,255,0.12)', color: '#7FB0FF', border: '1px solid rgba(0,82,255,0.22)', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>default</div>
                </div>
                <div style={{ color: 'var(--gray)', fontSize: 13, textAlign: 'center', padding: '18px 0', borderTop: '1px solid var(--border)' }}>No additional recipients added yet</div>
              </div>
            </div>

            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Spending Alerts</div>
              <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>Configure alert behavior for agency billing activity.</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Current Monthly Usage</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13 }}>PKR {Number(wallet.balance || 0).toLocaleString()} tracked against your agency balance.</div>
                </div>
                <div style={{ background: 'var(--dark3)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Alert Status</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13 }}>Use the settings panel to connect alerts, thresholds, and recipient emails.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'controls' && (
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>HighLevel SaaS Controls</div>
                <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Inspect plans, pull sub-account subscription details, and run rebilling or pause actions.</div>
              </div>
            </div>
            <AgencyControls initialLocationId={sessionLocationId} />
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>Agency PayFast Setup</div>
            <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Connect your own PayFast credentials before creating agency invoices or collecting agency-level payments.</div>
            <AgencyPayfastSettings />
          </div>
        </div>
      </div>
    </div>
  );
}

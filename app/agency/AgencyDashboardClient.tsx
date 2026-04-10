'use client';

import { useMemo, useState } from 'react';
import AgencyControls from './AgencyControls';
import AgencyPayfastSettings from './AgencyPayfastSettings';

type Stats = {
  mrr: number;
  active_count: number;
  trial_count: number;
  suspended_count: number;
};

export default function AgencyDashboardClient({
  stats,
  sessionLocationId,
  installed,
  restored,
  payfastReady,
}: {
  stats: Stats;
  sessionLocationId: string;
  installed: boolean;
  restored: boolean;
  payfastReady: boolean;
}) {
  const [tab, setTab] = useState<'overview' | 'billing' | 'controls' | 'integrations'>('overview');

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
    { id: 'overview', label: 'Overview' },
    { id: 'billing', label: 'Billing' },
    { id: 'controls', label: 'SaaS Controls' },
    { id: 'integrations', label: 'Integrations' },
  ] as const;

  const tabButton = (active: boolean) => ({
    border: 'none',
    background: active ? 'var(--blue)' : 'transparent',
    color: active ? 'white' : 'var(--gray)',
    borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
    padding: '12px 4px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as const);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', color: 'white', padding: '28px 24px 40px', fontFamily: 'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 18 }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,82,255,0.12)', border: '1px solid rgba(0,82,255,0.22)', borderRadius: 999, padding: '7px 12px', color: '#7FB0FF', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              Agency Control Center
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, lineHeight: 1.05, fontWeight: 800, marginBottom: 10 }}>Billing Dashboard</h1>
            <p style={{ color: 'var(--gray)', fontSize: 15, lineHeight: 1.75 }}>
              Manage subscriptions, payment settings, and agency-level PayFast billing from a cleaner, more focused control surface.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 260 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          {overviewCards.map((card) => (
            <div key={card.label} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10 }}>{card.label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: card.tone === 'green' ? '#22C55E' : card.tone === 'amber' ? '#FBBF24' : card.tone === 'red' ? '#F87171' : '#7FB0FF' }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={tabButton(tab === item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Agency Snapshot</div>
              <p style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.8, marginBottom: 18 }}>
                Keep billing, subscription health, and integration readiness in one place. This view is designed to feel closer to a modern SaaS billing console.
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['Billing status', payfastReady ? 'Ready to collect agency payments' : 'Complete PayFast setup first'],
                  ['Install mode', 'Agency'],
                  ['Client operations', 'SaaS enable, update, pause, and rebilling'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: 'var(--dark3)', borderRadius: 14 }}>
                    <span style={{ color: 'var(--gray)', fontSize: 13 }}>{label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <a href="/agency/install" style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, textDecoration: 'none', color: 'white' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Install Flow</div>
                <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Open the agency install page if you need to reconnect or review OAuth setup.</div>
              </a>
              <a href="/docs" style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, textDecoration: 'none', color: 'white' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Docs</div>
                <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Review the implementation notes and operational references.</div>
              </a>
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Agency PayFast Setup</div>
              <p style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.8, marginBottom: 18 }}>Connect your own PayFast credentials before creating agency invoices or collecting agency-level payments.</p>
              <AgencyPayfastSettings />
            </div>
          </div>
        )}

        {tab === 'controls' && (
          <div style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 20, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>HighLevel SaaS Controls</div>
                <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>Inspect plans, pull sub-account subscription details, and run rebilling or pause actions.</div>
              </div>
            </div>
            <AgencyControls initialLocationId={sessionLocationId} />
          </div>
        )}

        {tab === 'integrations' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              ['PayFast Settings', payfastReady ? 'Credentials are configured and billing is unlocked.' : 'Set your merchant ID and key first.'],
              ['Agency Install', 'Use the OAuth install path for agency-level access.'],
              ['Ops Note', 'Keep agency control separate from admin-only pages.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ color: 'var(--gray)', fontSize: 13, lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

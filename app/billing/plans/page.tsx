'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_locations: number;
  features: string[] | string;
  trial_days: number;
}

export default function BillingPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pfForm, setPfForm] = useState<{ actionUrl: string; fields: Record<string, string> } | null>(null);

  useEffect(() => {
    fetch('/api/billing/plans').then((r) => r.json()).then(setPlans).catch(() => setError('Failed to load plans'));
  }, []);

  useEffect(() => {
    if (!pfForm) return;
    const form = document.getElementById('billingPayForm') as HTMLFormElement | null;
    if (form) {
      const timer = window.setTimeout(() => form.submit(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [pfForm]);

  async function subscribe(planId: number) {
    setLoading(planId);
    setError('');
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, billingCycle: cycle }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to start billing checkout');
      setLoading(null);
      return;
    }
    setPfForm(data);
  }

  if (pfForm) {
    return (
      <div style={{ minHeight: '100vh', background: '#050A1A', display: 'grid', placeItems: 'center', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p style={{ color: '#8A9BC0', marginBottom: 20 }}>Redirecting to GoPayFast secure checkout…</p>
          <form id="billingPayForm" action={pfForm.actionUrl} method="POST">
            {Object.entries(pfForm.fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050A1A', color: 'white', fontFamily: 'DM Sans, sans-serif', padding: '40px 24px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, marginBottom: 10 }}>Agency Billing Plans</div>
          <div style={{ color: '#8A9BC0', fontSize: 15 }}>Choose a plan to keep your CRM account active after the free trial.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {(['monthly', 'yearly'] as const).map((value) => (
            <button key={value} onClick={() => setCycle(value)} style={{ background: cycle === value ? '#0052FF' : 'transparent', color: cycle === value ? 'white' : '#8A9BC0', border: '1px solid rgba(255,255,255,0.12)', padding: '10px 16px', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>
              {value === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>

        {error && <div style={{ maxWidth: 700, margin: '0 auto 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#EF4444' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {plans.map((plan) => {
            const price = cycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
            const features = Array.isArray(plan.features) ? plan.features : (() => { try { return JSON.parse(plan.features || '[]'); } catch { return []; } })();
            return (
              <div key={plan.id} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: '#8A9BC0', marginBottom: 14 }}>{plan.max_locations >= 9999 ? 'Unlimited locations' : `${plan.max_locations} location${plan.max_locations > 1 ? 's' : ''}`}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#3D7FFF', marginBottom: 6 }}>PKR {price.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#8A9BC0', marginBottom: 18 }}>{cycle === 'monthly' ? 'per month' : 'per year'}</div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 22 }}>
                  {features.map((feature: string) => <div key={feature} style={{ fontSize: 13, color: '#E2E8F0' }}>• {feature}</div>)}
                </div>
                <button onClick={() => subscribe(plan.id)} disabled={loading === plan.id} style={{ width: '100%', background: '#0052FF', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, opacity: loading === plan.id ? 0.6 : 1 }}>
                  {loading === plan.id ? 'Processing…' : `Start ${plan.trial_days}-Day Trial / Subscribe`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

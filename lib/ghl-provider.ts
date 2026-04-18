import { getValidToken } from './ghl';

const GHL_API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

function appUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

async function ghlRequest(path: string, token: string, method: 'GET' | 'POST' | 'PUT', body?: unknown) {
  const res = await fetch(`${GHL_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `GHL request failed: ${res.status}`);
  }

  return data;
}

function getMarketplaceToken() {
  return process.env.GHL_MARKETPLACE_APP_TOKEN || process.env.MARKETPLACE_APP_TOKEN || '';
}

async function marketplaceRequest(path: string, method: 'GET' | 'POST' | 'PUT', body?: unknown) {
  const token = getMarketplaceToken();
  if (!token) {
    throw new Error('Missing marketplace app token (GHL_MARKETPLACE_APP_TOKEN)');
  }

  return ghlRequest(path, token, method, body);
}

export async function ensureCustomProviderProvisioned(locationId: string, config?: {
  merchantId?: string | null;
  merchantKey?: string | null;
  passphrase?: string | null;
  environment?: string | null;
}) {
  const locationToken = await getValidToken(locationId);
  const marketplaceToken = getMarketplaceToken();
  const token = marketplaceToken || locationToken;

  if (!token) {
    return { ok: false, reason: 'missing_token' as const };
  }

  const details: Array<{ step: string; ok: boolean; error?: string }> = [];

  const providerBody = {
    locationId,
    providerName: 'GoPayFast by 10x Digital Ventures',
    paymentsUrl: appUrl('/ghl-checkout'),
    queryUrl: appUrl('/api/ghl/query'),
    configUrl: appUrl('/ghl-config'),
  };

  const connectBody = {
    locationId,
    providerName: 'GoPayFast by 10x Digital Ventures',
    paymentsUrl: appUrl('/ghl-checkout'),
    queryUrl: appUrl('/api/ghl/query'),
    configUrl: appUrl('/ghl-config'),
    merchant_id: config?.merchantId || null,
    merchant_key: config?.merchantKey || null,
    passphrase: config?.passphrase || null,
    environment: config?.environment || 'live',
    merchantId: config?.merchantId || null,
    merchantKey: config?.merchantKey || null,
  };

  try {
    if (marketplaceToken) {
      await marketplaceRequest('/payments/custom-provider/provider', 'POST', providerBody);
    } else {
      await ghlRequest('/payments/custom-provider/provider', token, 'POST', providerBody);
    }
    details.push({ step: 'create-integration', ok: true });
  } catch (error) {
    details.push({ step: 'create-integration', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] provider association failed', error);
  }

  try {
    if (marketplaceToken) {
      await marketplaceRequest('/payments/custom-provider/connect', 'POST', connectBody);
    } else {
      await ghlRequest('/payments/custom-provider/connect', token, 'POST', connectBody);
    }
    details.push({ step: 'create-config', ok: true });
  } catch (error) {
    details.push({ step: 'create-config', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] provider config failed', error);
  }

  try {
    if (marketplaceToken) {
      await marketplaceRequest('/payments/custom-provider/capabilities', 'PUT', {
        locationId,
        payments: true,
        orders: true,
        subscriptions: true,
        refunds: true,
        savedCards: true,
      });
      details.push({ step: 'capabilities', ok: true });
    } else {
      details.push({ step: 'capabilities', ok: false, error: 'missing-marketplace-token' });
    }
  } catch (error) {
    details.push({ step: 'capabilities', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] capabilities update failed', error);
  }

  return {
    ok: true,
    usedMarketplaceToken: !!marketplaceToken,
    usedLocationToken: !marketplaceToken && !!locationToken,
    details,
  };
}

export async function debugProvisionCustomProvider(locationId: string, config?: {
  merchantId?: string | null;
  merchantKey?: string | null;
  passphrase?: string | null;
  environment?: string | null;
}) {
  return ensureCustomProviderProvisioned(locationId, config);
}

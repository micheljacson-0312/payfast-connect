import { getValidToken } from './ghl';
import { query } from './db';

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

export function getMarketplaceToken(appType: 'normal' | 'agency' = 'normal') {
  if (appType === 'agency') {
    return process.env.AGENCY_GHL_APP_TOKEN || process.env.GHL_APP_TOKEN || '';
  }

  return process.env.GHL_APP_TOKEN || '';
}

async function marketplaceRequest(path: string, method: 'GET' | 'POST' | 'PUT', body?: unknown, appType: 'normal' | 'agency' = 'normal') {
  const token = getMarketplaceToken(appType);
  if (!token) {
    throw new Error(appType === 'agency'
      ? 'Missing agency app token (AGENCY_GHL_APP_TOKEN)'
      : 'Missing normal app token (GHL_APP_TOKEN)');
  }

  return ghlRequest(path, token, method, body);
}

export async function ensureCustomProviderProvisioned(locationId: string, config?: {
  merchantId?: string | null;
  merchantKey?: string | null;
  passphrase?: string | null;
  environment?: string | null;
  appType?: 'normal' | 'agency';
}) {
  const locationToken = await getValidToken(locationId);
  const appType = config?.appType || 'normal';
  const marketplaceToken = getMarketplaceToken(appType);
  const token = marketplaceToken || locationToken;

  if (!token) {
    return { ok: false, reason: 'missing_token' as const };
  }

  const details: Array<{ step: string; ok: boolean; error?: string }> = [];

  const providerBody = {
    locationId,
    providerName: 'Payfast connect By 10x Digital Ventures',
    paymentsUrl: appUrl('/ghl-checkout'),
    queryUrl: appUrl('/api/ghl/query'),
    configUrl: appUrl('/ghl-config'),
    imageUrl: process.env.GHL_PROVIDER_LOGO_URL || 'https://cdn-icons-png.flaticon.com/512/1019/1019608.png',
  };


  const connectBody = {
    locationId,
    providerName: 'Payfast connect By 10x Digital Ventures',
    paymentsUrl: appUrl('/ghl-checkout'),
    queryUrl: appUrl('/api/ghl/query'),
    configUrl: appUrl('/ghl-config'),
    merchant_id: config?.merchantId || null,
    merchant_key: config?.merchantKey || null,
    passphrase: config?.passphrase || null,
    environment: config?.environment || 'live',
    merchantId: config?.merchantId || null,
    merchantKey: config?.merchantKey || null,
    imageUrl: process.env.GHL_PROVIDER_LOGO_URL || 'https://cdn-icons-png.flaticon.com/512/1019/1019608.png',
  };

  try {
    if (marketplaceToken) {
      await marketplaceRequest('/payments/custom-provider/provider', 'POST', providerBody, appType);
    } else {
      await ghlRequest('/payments/custom-provider/provider', token, 'POST', providerBody);
    }
    details.push({ step: 'create-integration', ok: true });
  } catch (error) {
    details.push({ step: 'create-integration', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] provider association failed', error);
  }

  try {
    let connectResp: any = null;
    if (marketplaceToken) {
      connectResp = await marketplaceRequest('/payments/custom-provider/connect', 'POST', connectBody, appType);
    } else {
      connectResp = await ghlRequest('/payments/custom-provider/connect', token, 'POST', connectBody);
    }

    // If the connect response includes provider keys, persist them for this location
    const apiKey = connectResp?.apiKey || connectResp?.api_key || connectResp?.providerApiKey || connectResp?.provider_api_key || null;
    const publishableKey = connectResp?.publishableKey || connectResp?.publishable_key || connectResp?.providerPublishableKey || connectResp?.provider_publishable_key || null;

    if (apiKey || publishableKey) {
      try {
        await query(`UPDATE installations SET provider_api_key = ?, provider_publishable_key = ? WHERE location_id = ?`, [apiKey, publishableKey, locationId]);
        details.push({ step: 'create-config', ok: true });
        try { (await import('./alerts')).alertAdmin('ghl_provider_keys_saved', { locationId, hasApiKey: !!apiKey, hasPublishableKey: !!publishableKey }); } catch {}
      } catch (err) {
        details.push({ step: 'create-config', ok: false, error: err instanceof Error ? err.message : String(err) });
        console.warn('[GHL Provider] failed to persist provider keys', err);
        try { (await import('./alerts')).alertAdmin('ghl_provider_keys_persist_failed', { locationId, error: err instanceof Error ? err.message : String(err) }); } catch {}
      }
    } else {
      details.push({ step: 'create-config', ok: true });
    }
  } catch (error) {
    details.push({ step: 'create-config', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] provider config failed', error);
    try { (await import('./alerts')).alertAdmin('ghl_provider_connect_failed', { locationId, error: error instanceof Error ? error.message : String(error) }); } catch {}
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
      }, appType);
      details.push({ step: 'capabilities', ok: true });
    } else {
      details.push({ step: 'capabilities', ok: false, error: 'missing-marketplace-token' });
    }
  } catch (error) {
    details.push({ step: 'capabilities', ok: false, error: error instanceof Error ? error.message : String(error) });
    console.warn('[GHL Provider] capabilities update failed', error);
    try { (await import('./alerts')).alertAdmin('ghl_provider_capabilities_failed', { locationId, error: error instanceof Error ? error.message : String(error) }); } catch {}
  }

  return {
    ok: true,
    usedMarketplaceToken: !!marketplaceToken,
    usedLocationToken: !marketplaceToken && !!locationToken,
    appType,
    details,
  };
}

export async function disconnectCustomProvider(locationId: string, appType: 'normal' | 'agency' = 'normal') {
  const marketplaceToken = getMarketplaceToken(appType);
  if (!marketplaceToken) {
    throw new Error(`Missing marketplace token for ${appType} app`);
  }

  try {
    await marketplaceRequest('/payments/custom-provider/disconnect', 'POST', { locationId }, appType);
    return { ok: true };
  } catch (error) {
    console.error('[GHL Provider] disconnect failed', error);
    throw error;
  }
}

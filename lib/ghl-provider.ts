import { getValidToken } from './ghl';
import { query } from './db';
import crypto from 'crypto';

const GHL_API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

function appUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

const PROVIDER_NAME = 'Payfast Connect by 10x Digital Ventures';
const PROVIDER_DESCRIPTION = 'CRM-native PayFast payment connector';

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
    const msg = typeof data === 'string' ? data : data?.message || data?.error || `GHL request failed: ${res.status}`;
    const err = new Error(`${res.status} ${msg}`);
    (err as any).status = res.status;
    (err as any).body = data;
    throw err;
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

async function chooseToken(locationId: string, appType: 'normal' | 'agency') {
  const marketplaceToken = getMarketplaceToken(appType);
  if (marketplaceToken) return { token: marketplaceToken, isMarketplace: true };
  const locationToken = await getValidToken(locationId);
  if (locationToken) return { token: locationToken, isMarketplace: false };
  return { token: '', isMarketplace: false };
}

async function ensureProviderKeys(locationId: string) {
  const rows = await query<any[]>(
    `SELECT provider_api_key, provider_publishable_key
     FROM installations WHERE location_id = ? LIMIT 1`,
    [locationId]
  );

  let apiKey = rows[0]?.provider_api_key || null;
  let publishableKey = rows[0]?.provider_publishable_key || null;

  if (!apiKey || !publishableKey) {
    apiKey = apiKey || `sk_${crypto.randomBytes(24).toString('hex')}`;
    publishableKey = publishableKey || `pk_${crypto.randomBytes(16).toString('hex')}`;
    await query(
      `UPDATE installations
       SET provider_api_key = ?, provider_publishable_key = ?
       WHERE location_id = ?`,
      [apiKey, publishableKey, locationId]
    );
  }

  return { apiKey, publishableKey };
}

export async function registerProviderForLocation(
  locationId: string,
  appType: 'normal' | 'agency' = 'normal'
) {
  const { token, isMarketplace } = await chooseToken(locationId, appType);
  if (!token) return { ok: false, reason: 'missing_token' as const };

  const body = {
    name: PROVIDER_NAME,
    description: PROVIDER_DESCRIPTION,
    imageUrl: process.env.GHL_PROVIDER_LOGO_URL || appUrl('/logo.png'),
    locationId,
    queryUrl: appUrl('/api/ghl/query'),
    paymentsUrl: appUrl('/ghl-checkout'),
  };

  try {
    const resp = isMarketplace
      ? await marketplaceRequest('/payments/custom-provider/provider', 'POST', body, appType)
      : await ghlRequest('/payments/custom-provider/provider', token, 'POST', body);
    return { ok: true, response: resp };
  } catch (error) {
    console.error('[GHL Provider] registerProviderForLocation failed', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function connectProviderConfig(
  locationId: string,
  mode: 'live' | 'test' = 'live',
  appType: 'normal' | 'agency' = 'normal'
) {
  const { token, isMarketplace } = await chooseToken(locationId, appType);
  if (!token) return { ok: false, reason: 'missing_token' as const };

  const { apiKey, publishableKey } = await ensureProviderKeys(locationId);

  const body: Record<string, any> = {
    locationId,
    apiKey,
    publishableKey,
    [mode]: { apiKey, publishableKey },
  };

  try {
    const resp = isMarketplace
      ? await marketplaceRequest('/payments/custom-provider/connect', 'POST', body, appType)
      : await ghlRequest('/payments/custom-provider/connect', token, 'POST', body);
    return { ok: true, response: resp, apiKey, publishableKey };
  } catch (error) {
    console.error('[GHL Provider] connectProviderConfig failed', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateProviderCapabilities(
  locationId: string,
  appType: 'normal' | 'agency' = 'normal'
) {
  const marketplaceToken = getMarketplaceToken(appType);
  if (!marketplaceToken) {
    return { ok: false, reason: 'missing_marketplace_token' as const };
  }
  try {
    const resp = await marketplaceRequest('/payments/custom-provider/capabilities', 'PUT', {
      locationId,
      payments: true,
      orders: true,
      subscriptions: true,
      refunds: true,
      savedCards: true,
    }, appType);
    return { ok: true, response: resp };
  } catch (error) {
    console.error('[GHL Provider] updateProviderCapabilities failed', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function ensureCustomProviderProvisioned(
  locationId: string,
  options?: { appType?: 'normal' | 'agency' }
) {
  const appType = options?.appType || 'normal';
  const steps: Array<{ step: string; ok: boolean; error?: string }> = [];

  const reg = await registerProviderForLocation(locationId, appType);
  steps.push({ step: 'register', ok: !!reg.ok, error: (reg as any).error });

  const caps = await updateProviderCapabilities(locationId, appType);
  steps.push({ step: 'capabilities', ok: !!caps.ok, error: (caps as any).error });

  return { ok: true, appType, steps };
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
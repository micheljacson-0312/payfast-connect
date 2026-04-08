import { query, Installation } from './db';

const GHL_API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

async function refreshAccessToken(refreshToken: string, isAgency = false) {
  try {
    const res = await fetch(`${GHL_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: isAgency ? (process.env.AGENCY_GHL_CLIENT_ID || process.env.GHL_CLIENT_ID!) : process.env.GHL_CLIENT_ID!,
        client_secret: isAgency ? (process.env.AGENCY_GHL_CLIENT_SECRET || process.env.GHL_CLIENT_SECRET!) : process.env.GHL_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAgencyContext(locationId: string) {
  const rows = await query<Installation[]>('SELECT * FROM installations WHERE location_id = ? LIMIT 1', [locationId]);
  if (!rows.length) return null;
  const inst = rows[0];
  const expiresAt = new Date(inst.expires_at).getTime();
  let accessToken = inst.access_token;

  if (Date.now() >= expiresAt - 5 * 60 * 1000 && inst.refresh_token) {
    const refreshed = await refreshAccessToken(inst.refresh_token, true);
    if (refreshed?.access_token) {
      accessToken = refreshed.access_token;
      await query(
        `UPDATE installations SET access_token = ?, refresh_token = ?, expires_at = ? WHERE location_id = ?`,
        [refreshed.access_token, refreshed.refresh_token, new Date(Date.now() + refreshed.expires_in * 1000), locationId]
      );
    }
  }

  return {
    locationId,
    companyId: inst.company_id,
    accessToken,
  };
}

async function agencyRequest(path: string, method: string, accessToken: string, body?: unknown) {
  const res = await fetch(`${GHL_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || text || `GHL SaaS request failed: ${res.status}`);
  }

  return data;
}

export async function getAgencyPlans(companyId: string, accessToken: string) {
  return agencyRequest(`/saas/agency-plans/${companyId}`, 'GET', accessToken);
}

export async function getLocationSubscriptionDetails(locationId: string, accessToken: string) {
  return agencyRequest(`/saas/get-saas-subscription/${locationId}`, 'GET', accessToken);
}

export async function updateRebilling(companyId: string, accessToken: string, payload: unknown) {
  return agencyRequest(`/saas/update-rebilling/${companyId}`, 'POST', accessToken, payload);
}

export async function enableSaasLocation(locationId: string, accessToken: string, payload: unknown) {
  return agencyRequest(`/saas/enable-saas/${locationId}`, 'POST', accessToken, payload);
}

export async function updateSaasSubscription(locationId: string, accessToken: string, payload: unknown) {
  return agencyRequest(`/saas/update-saas-subscription/${locationId}`, 'PUT', accessToken, payload);
}

export async function pauseSaasLocation(locationId: string, accessToken: string, payload: unknown = {}) {
  return agencyRequest(`/saas/pause/${locationId}`, 'POST', accessToken, payload);
}

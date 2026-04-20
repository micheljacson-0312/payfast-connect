import { getValidToken } from './ghl';

const GHL_API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

async function ghlRequest(path: string, token: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) {
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
    throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `GHL Payment request failed: ${res.status}`);
  }

  return data;
}

export async function listGHLTransactions(locationId: string) {
  const token = await getValidToken(locationId);
  return ghlRequest(`/payments/transactions?locationId=${locationId}`, token, 'GET');
}

export async function listGHLSubscriptions(locationId: string) {
  const token = await getValidToken(locationId);
  return ghlRequest(`/payments/subscriptions?locationId=${locationId}`, token, 'GET');
}

export async function createGHLCoupon(locationId: string, couponData: any) {
  const token = await getValidToken(locationId);
  return ghlRequest('/payments/coupons', token, 'POST', {
    ...couponData,
    locationId,
  });
}

export async function getGHLCoupon(locationId: string, couponId: string) {
  const token = await getValidToken(locationId);
  return ghlRequest(`/payments/coupons/${couponId}`, token, 'GET');
}

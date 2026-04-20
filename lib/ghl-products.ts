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
    throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `GHL Products request failed: ${res.status}`);
  }

  return data;
}

export async function createGHLProduct(locationId: string, productData: {
  name: string;
  description?: string;
}) {
  const token = await getValidToken(locationId);
  if (!token) throw new Error('Failed to retrieve a valid GHL access token');
  
  return ghlRequest('/products', token, 'POST', {
    ...productData,
    locationId,
  });
}

export async function createGHLPrice(locationId: string, productId: string, priceData: {
  price: number;
  currency: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year' | 'week' | 'day';
}) {
  const token = await getValidToken(locationId);
  if (!token) throw new Error('Failed to retrieve a valid GHL access token');
  
  return ghlRequest('/prices', token, 'POST', {
    ...priceData,
    productId,
    locationId,
  });
}

export async function getGHLProducts(locationId: string) {
  const token = await getValidToken(locationId);
  if (!token) throw new Error('Failed to retrieve a valid GHL access token');
  
  return ghlRequest(`/products?locationId=${locationId}`, token, 'GET');
}

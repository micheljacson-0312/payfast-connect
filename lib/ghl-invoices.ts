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
    throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `GHL Invoice request failed: ${res.status}`);
  }

  return data;
}

export async function createGHLInvoice(locationId: string, invoiceData: any) {
  const token = await getValidToken(locationId);
  return ghlRequest('/invoices', token, 'POST', {
    ...invoiceData,
    locationId,
  });
}

export async function sendGHLInvoice(locationId: string, invoiceId: string) {
  const token = await getValidToken(locationId);
  return ghlRequest(`/invoices/${invoiceId}/send`, token, 'POST');
}

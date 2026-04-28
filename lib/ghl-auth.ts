import { NextRequest } from 'next/server';
import { query } from './db';
import { alertAdmin } from './alerts';

// Extract API key from headers only. Accepts X-API-KEY or Authorization: ApiKey <key> or Authorization: Bearer <key>
export function extractApiKey(request: NextRequest): string | null {
  const headerApiKey = request.headers.get('x-api-key') || null;
  const authHeader = request.headers.get('authorization') || '';
  const authHeaderKey = authHeader.startsWith('ApiKey ') ? authHeader.slice(7) : (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
  return headerApiKey || authHeaderKey || null;
}

// Validate provider api key for a given location. Sends an alert on failure.
export async function validateProviderApiKey(locationId: string | undefined | null, request: NextRequest, eventType = 'unauthorized_query'): Promise<boolean> {
  if (!locationId) return false;
  const apiKey = extractApiKey(request);
  const rows = await query<any[]>(`SELECT provider_api_key FROM installations WHERE location_id = ? LIMIT 1`, [locationId]);
  const expected = rows[0]?.provider_api_key || null;
  const ok = expected && apiKey && String(expected) === String(apiKey);
  if (!ok) {
    try { await alertAdmin(eventType, { locationId, received: apiKey ? 'present' : 'missing' }); } catch (e) { /* ignore */ }
  }
  return !!ok;
}

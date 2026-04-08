import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { applySessionCookie } from '@/lib/session';
import { getAppUrlWithSearch } from '@/lib/app-url';

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

async function resolveLocationIdFallback() {
  const rows = await query<any[]>(
    `SELECT location_id FROM installations ORDER BY created_at DESC, id DESC LIMIT 1`
  );
  return rows[0]?.location_id || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const locationIdFromQuery = searchParams.get('locationId') || searchParams.get('location_id');
  const companyIdFromQuery = searchParams.get('companyId') || searchParams.get('company_id');

  // If a stale sub-account session exists, drop it before completing agency auth.
  const clearExistingSession = (response: NextResponse) => {
    response.cookies.delete('pf_session');
    return response;
  };

  if (error || !code) {
    return clearExistingSession(NextResponse.redirect(getAppUrlWithSearch(`/agency/install?error=${error || 'access_denied'}`, request)));
  }

  try {
    const tokenRes = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.AGENCY_GHL_CLIENT_ID || process.env.GHL_CLIENT_ID!,
        client_secret: process.env.AGENCY_GHL_CLIENT_SECRET || process.env.GHL_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/agency/oauth/callback`,
      }),
    });

    const raw = await tokenRes.text();
    const tokens = JSON.parse(raw);
    if (!tokenRes.ok) throw new Error(`Agency token exchange failed: ${tokenRes.status} ${raw.slice(0, 200)}`);

    const accessToken = pickString(tokens.access_token, tokens.accessToken, tokens.data?.access_token, tokens.data?.accessToken);
    const refreshToken = pickString(tokens.refresh_token, tokens.refreshToken, tokens.data?.refresh_token, tokens.data?.refreshToken);
    let locationId = pickString(tokens.locationId, tokens.location_id, tokens.data?.locationId, tokens.data?.location_id, locationIdFromQuery);
    const companyId = pickString(tokens.companyId, tokens.company_id, tokens.data?.companyId, tokens.data?.company_id, companyIdFromQuery);
    const expiresIn = Number(tokens.expires_in ?? tokens.expiresIn ?? tokens.data?.expires_in ?? 3600);

    if (!locationId) {
      locationId = await resolveLocationIdFallback();
    }

    if (!accessToken || !refreshToken || !locationId) {
      throw new Error('Agency OAuth missing required fields');
    }

    await query(
      `INSERT INTO installations (location_id, company_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at)`,
      [locationId, companyId, accessToken, refreshToken, new Date(Date.now() + expiresIn * 1000)]
    );

    return applySessionCookie(clearExistingSession(NextResponse.redirect(getAppUrlWithSearch('/agency?installed=1', request))), locationId, 'agency');
  } catch (err) {
    console.error('Agency OAuth callback error:', err);
    return clearExistingSession(NextResponse.redirect(getAppUrlWithSearch('/agency/install?error=server_error', request)));
  }
}

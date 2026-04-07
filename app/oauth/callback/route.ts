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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');
  const locationIdFromQuery = searchParams.get('locationId') || searchParams.get('location_id');
  const companyIdFromQuery = searchParams.get('companyId') || searchParams.get('company_id');

  if (error || !code) {
    return NextResponse.redirect(
      getAppUrlWithSearch(`/install?error=${error || 'access_denied'}`, request)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/oauth/callback`,
      }),
    });

    const rawText = await tokenRes.text();
    let tokens: any;

    try {
      tokens = JSON.parse(rawText);
    } catch {
      throw new Error(`Token exchange returned non-JSON response: ${rawText.slice(0, 300)}`);
    }

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status} ${rawText.slice(0, 300)}`);
    }

    const accessToken = pickString(tokens.access_token, tokens.accessToken, tokens.data?.access_token, tokens.data?.accessToken);
    const refreshToken = pickString(tokens.refresh_token, tokens.refreshToken, tokens.data?.refresh_token, tokens.data?.refreshToken);
    const locationId = pickString(
      tokens.locationId,
      tokens.location_id,
      tokens.data?.locationId,
      tokens.data?.location_id,
      tokens.user?.locationId,
      tokens.user?.location_id,
      locationIdFromQuery
    );
    const companyId = pickString(
      tokens.companyId,
      tokens.company_id,
      tokens.data?.companyId,
      tokens.data?.company_id,
      tokens.user?.companyId,
      tokens.user?.company_id,
      companyIdFromQuery
    );
    const expiresIn = Number(tokens.expires_in ?? tokens.expiresIn ?? tokens.data?.expires_in ?? tokens.data?.expiresIn ?? 3600);

    if (!accessToken || !refreshToken || !locationId) {
      throw new Error(`Missing OAuth fields. access_token=${!!accessToken} refresh_token=${!!refreshToken} locationId=${locationId || 'missing'}`);
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Upsert installation in DB
    await query(
      `INSERT INTO installations
         (location_id, company_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_id    = VALUES(company_id),
         access_token  = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         expires_at    = VALUES(expires_at)`,
      [
        locationId,
        companyId,
        accessToken,
        refreshToken,
        expiresAt,
      ]
    );

    // Redirect to settings (new install needs GoPayFast credentials)
    return applySessionCookie(
      NextResponse.redirect(getAppUrlWithSearch('/settings?installed=1', request)),
      locationId
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      getAppUrlWithSearch('/install?error=server_error', request)
    );
  }
}

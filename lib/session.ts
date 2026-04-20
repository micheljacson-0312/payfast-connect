import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secret = () => {
  const s = process.env.SESSION_SECRET || 'default_secret_fallback_32_chars_min';
  return new TextEncoder().encode(s);
};

export type InstallMode = 'subaccount' | 'agency';

export async function createSession(locationId: string, installMode: InstallMode = 'subaccount'): Promise<void> {
  const token = await signSessionToken(locationId, installMode);

  (await cookies()).set('pf_session', token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24 * 7,
    path:      '/',
  });
}

export async function signSessionToken(locationId: string, installMode: InstallMode = 'subaccount'): Promise<string> {
  return new SignJWT({ locationId, installMode })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function applySessionCookie(response: NextResponse, locationId: string, installMode: InstallMode = 'subaccount'): Promise<NextResponse> {
  const token = await signSessionToken(locationId, installMode);

  response.cookies.set('pf_session', token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24 * 7,
    path:      '/',
  });

  return response;
}

export async function getSession(): Promise<{ locationId: string; installMode: InstallMode } | null> {
  const token = (await cookies()).get('pf_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      locationId: String(payload.locationId),
      installMode: (payload.installMode as InstallMode) || 'subaccount',
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete('pf_session');
}

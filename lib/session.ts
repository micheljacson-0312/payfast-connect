import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSession(locationId: string): Promise<void> {
  const token = await signSessionToken(locationId);

  (await cookies()).set('pf_session', token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24 * 7,
    path:      '/',
  });
}

export async function signSessionToken(locationId: string): Promise<string> {
  return new SignJWT({ locationId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function applySessionCookie(response: NextResponse, locationId: string): Promise<NextResponse> {
  const token = await signSessionToken(locationId);

  response.cookies.set('pf_session', token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    maxAge:    60 * 60 * 24 * 7,
    path:      '/',
  });

  return response;
}

export async function getSession(): Promise<{ locationId: string } | null> {
  const token = (await cookies()).get('pf_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { locationId: string };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete('pf_session');
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAppUrl } from '@/lib/app-url';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

const PROTECTED = ['/dashboard', '/payments', '/settings', '/subscriptions'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (PROTECTED.some(p => path.startsWith(p))) {
    const token = request.cookies.get('pf_session')?.value;

    if (!token) {
      return NextResponse.redirect(getAppUrl('/install', request));
    }

    try {
      await jwtVerify(token, secret());
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(getAppUrl('/install', request));
      response.cookies.delete('pf_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/payments/:path*',
    '/settings/:path*',
    '/subscriptions/:path*',
  ],
};

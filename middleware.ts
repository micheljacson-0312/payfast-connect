import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getAppUrl } from '@/lib/app-url';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

const PROTECTED = [
  '/dashboard',
  '/agency',
  '/payments',
  '/payment-schedules',
  '/payment-links',
  '/billing',
  '/products',
  '/invoices',
  '/order-forms',
  '/coupons',
  '/subscriptions',
  '/text2pay',
  '/settings',
  '/docs',
  '/support',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && path !== '/admin/login') {
    const adminCookie = request.cookies.get('pf_admin')?.value;
    const expectedAdmin = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (adminCookie !== expectedAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (PROTECTED.some(p => path.startsWith(p))) {
    const token = request.cookies.get('pf_session')?.value;

    if (!token) {
      return NextResponse.redirect(getAppUrl('/install', request));
    }

    try {
      await jwtVerify(token, secret());

      const bypassBilling = path.startsWith('/billing') || path.startsWith('/admin') || path.startsWith('/docs') || path.startsWith('/support');
      if (!bypassBilling) {
        try {
          const statusRes = await fetch(`${request.nextUrl.origin}/api/billing/status`, {
            headers: { cookie: request.headers.get('cookie') || '' },
            cache: 'no-store',
          });

          if (statusRes.ok) {
            const billing = await statusRes.json();
            if (billing?.isSuspended) {
              return NextResponse.redirect(new URL('/billing/suspended', request.url));
            }
            if (billing?.needsPlanSelection) {
              return NextResponse.redirect(new URL('/billing/plans', request.url));
            }
          }
        } catch {
          // Billing gate should fail open to avoid blocking the app on transient checks.
        }
      }

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
    '/agency/:path*',
    '/admin/:path*',
    '/payments/:path*',
    '/billing/:path*',
    '/payment-schedules/:path*',
    '/payment-links/:path*',
    '/products/:path*',
    '/invoices/:path*',
    '/order-forms/:path*',
    '/coupons/:path*',
    '/settings/:path*',
    '/subscriptions/:path*',
    '/text2pay/:path*',
    '/docs/:path*',
    '/support/:path*',
  ],
};

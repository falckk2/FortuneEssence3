import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Generates the per-request Content-Security-Policy header value.
 * Uses a cryptographic nonce to authorise only inline scripts that Next.js
 * renders with that nonce, eliminating the broad `unsafe-inline` allowance.
 */
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const connectSrc = [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.com',
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    'wss://*.supabase.co',
    isDev ? 'http://localhost:8001' : '',
  ].filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    // nonce covers Next.js inline scripts (__NEXT_DATA__, theme-init, etc.)
    // unsafe-inline is intentionally absent — the nonce is the escape hatch.
    // 'strict-dynamic' allows scripts loaded by a nonce-trusted script to also run,
    // which is required for Next.js chunk loading and React hydration to work.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  // Generate a fresh nonce for every request.
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.isAdmin) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Clone request headers so the layout Server Component can read the nonce.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Attach CSP with nonce to the response.
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce));

  return response;
}

export const config = {
  // Apply to all page and API routes; exclude static assets and _next internals
  // that don't need a CSP nonce.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};

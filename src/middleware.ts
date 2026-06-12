import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  defaultLocale,
  splitLocaleFromPath,
  LOCALE_COOKIE,
  LOCALE_HEADER,
} from '@/lib/i18n';

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
    // 'unsafe-eval' is required in development mode for React error overlays and
    // Next.js hot-reloading; it is omitted in production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com`,
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

  const { pathname, search } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  const isFileRequest = /\.\w+$/.test(pathname); // sitemap.xml, robots.txt, icons, …

  // ---- Locale resolution (FABLE-011) -------------------------------------
  // /en/...  → rewrite to /... with x-locale: en (URL keeps the prefix).
  // /sv/...  → permanent redirect to the unprefixed canonical URL.
  // /...     → x-locale: sv; on a first visit (no cookie) an English-preferring
  //            browser is redirected once to the /en equivalent.
  // The locale MUST be resolved before the admin gate so /en/admin cannot
  // bypass it.
  let locale = defaultLocale;
  let routePath = pathname;

  if (!isApiRoute && !isFileRequest) {
    const split = splitLocaleFromPath(pathname);
    routePath = split.path;

    if (split.locale !== defaultLocale) {
      locale = split.locale;
    } else if (pathname === '/sv' || pathname.startsWith('/sv/')) {
      const canonical = new URL(pathname.replace(/^\/sv/, '') || '/', request.url);
      canonical.search = search;
      return NextResponse.redirect(canonical, 308);
    } else if (request.method === 'GET' && !request.cookies.get(LOCALE_COOKIE)) {
      // First visit, no stored preference: honour an English browser locale.
      const acceptLanguage = request.headers.get('accept-language') ?? '';
      const firstTag = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
      if (firstTag.startsWith('en')) {
        const englishUrl = new URL(`/en${pathname === '/' ? '' : pathname}`, request.url);
        englishUrl.search = search;
        const redirect = NextResponse.redirect(englishUrl);
        redirect.cookies.set(LOCALE_COOKIE, 'en', { path: '/', maxAge: 31536000, sameSite: 'lax' });
        return redirect;
      }
    }
  }

  // ---- Admin gate (on the delocalized path) -------------------------------
  const isAdminRoute = routePath.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirect', routePath);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Clone request headers so layout/pages can read the nonce and locale.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(LOCALE_HEADER, locale);

  // Non-default locales render the unprefixed route via rewrite; the browser
  // URL keeps the /en prefix.
  const response = routePath !== pathname
    ? NextResponse.rewrite(
        Object.assign(new URL(routePath, request.url), { search }),
        { request: { headers: requestHeaders } }
      )
    : NextResponse.next({ request: { headers: requestHeaders } });

  // Remember the visitor's locale so first-visit detection runs only once.
  if (!isApiRoute && !isFileRequest && request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  }

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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side rendering
  serverExternalPackages: ['@supabase/supabase-js', 'bwip-js'],
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add other image hosts as needed
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    // CORS headers are only emitted when the canonical app URL is configured.
    // Fail closed: with no configured origin, no cross-origin access is granted
    // (same-origin requests don't need CORS headers at all).
    const corsOrigin = process.env.NEXT_PUBLIC_APP_URL;
    const apiCorsBlock = corsOrigin
      ? [
          {
            source: '/api/(.*)',
            headers: [
              {
                key: 'Access-Control-Allow-Origin',
                value: corsOrigin
              },
              {
                key: 'Access-Control-Allow-Methods',
                value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
              },
              {
                key: 'Access-Control-Allow-Headers',
                value: 'X-Requested-With, Content-Type, Authorization'
              }
            ]
          }
        ]
      : [];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Content-Security-Policy is set per-request by src/middleware.ts using
          // a cryptographic nonce, replacing the former static unsafe-inline allowance.
          // Do NOT add a static CSP header here — it would conflict with the middleware header.
        ]
      },
      ...apiCorsBlock
    ];
  },

  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },
      {
        // Old tracking page consolidated into /track-order; query params
        // (e.g. ?tracking=) are passed through automatically.
        source: '/orders/track',
        destination: '/track-order',
        permanent: true,
      }
    ];
  },

  // Enable compression
  compress: true,
  
  // PoweredBy header removal for security
  poweredByHeader: false,

  // Webpack configuration for Node.js built-ins
  webpack: (config, { isServer }) => {
    // For server-side, Node.js built-ins are available
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        stream: false,
      };
    }
    return config;
  },

  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    // Add other public env vars here
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to complete even if there are type errors
    // Only use this if you have a separate type-checking process
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint during builds (handle separately in CI/CD)
    ignoreDuringBuilds: true,
  },

  // Output configuration for static exports (if needed)
  output: process.env.BUILD_MODE === 'export' ? 'export' : 'standalone',
  trailingSlash: false,
  
  // Enable React strict mode
  reactStrictMode: true,

  // SWC minification is enabled by default in Next.js 13+

  // Compiler options
  compiler: {
    // Remove console.log in production; keep error AND warn — several fixes
    // (e.g. is_admin lookup fallback, rate-limiter fail-open) rely on
    // console.warn for production observability.
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};

export default nextConfig;

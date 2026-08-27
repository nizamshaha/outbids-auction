/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Do not expose X-Powered-By: Next.js
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.dodopayments.com" "https://*.paypal.com")',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://challenges.cloudflare.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.dodopayments.com https://*.paypal.com https://fonts.googleapis.com https://fonts.gstatic.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.dodopayments.com https://*.paypal.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

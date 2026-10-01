/** @type {import('next').NextConfig} */

// The one external origin the browser is allowed to talk to. Reading it from the
// same env var the client uses keeps the policy and the client in step.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();

const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // nothing may put this site in a frame, which is what stops clickjacking
  "frame-ancestors 'none'",
  // a form on this site can only post back to this site, so an injected form
  // cannot quietly ship what someone typed to another server
  "form-action 'self'",
  // profile photos are served from the project's public avatars bucket
  ["img-src", "'self'", 'data:', 'blob:', supabaseOrigin].filter(Boolean).join(' '),
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js ships a small inline bootstrap script on every page, so inline
  // script has to stay allowed. Everything from another origin is still blocked.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  ['connect-src', "'self'", supabaseOrigin, supabaseOrigin.replace('https://', 'wss://')]
    .filter(Boolean)
    .join(' '),
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

// The public address used for canonical links, the sitemap and structured data.
// NEXT_PUBLIC_SITE_URL wins if set; otherwise Vercel's production domain, which
// becomes mmdcommunitycare.com on its own once that domain is added to the
// project. Inlined at build time so server and browser always agree.
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://mmd-prod.vercel.app')
).replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_SITE_URL: siteUrl },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;

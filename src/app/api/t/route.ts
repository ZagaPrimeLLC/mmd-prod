import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPublicPath } from '@/lib/analytics/paths';

/**
 * Where the public site's measurement events land. The browser sends small
 * batches; this route checks size and rate, classifies the request on the
 * server (device, country from the hosting headers, bot/staff/preview flags)
 * and hands everything to proj_mmd.ingest_web_events, which enforces the event
 * contract and deduplicates. The address is used only for rate limiting and is
 * never stored. The route always answers quickly; analytics never blocks a page.
 */

const MAX_BYTES = 32 * 1024;
let warnedNoKey = false;
const MAX_EVENTS = 50;
const PER_MINUTE = 120;

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget\/|python-requests|axios\/|node-fetch|go-http-client|dataprovider|prerender|phantom/i;

// Per instance; good enough to blunt a runaway client, not a security boundary.
const buckets = new Map<string, { n: number; reset: number }>();
function limited(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(key, { n: 1, reset: now + 60_000 });
    return false;
  }
  b.n += 1;
  return b.n > PER_MINUTE;
}

function device(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  if (/Mobi|iPhone|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

const str = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);

function supabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'proj_mmd' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) return new NextResponse(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  let body: { events?: unknown; meta?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const events = Array.isArray(body?.events)
    ? body.events.slice(0, MAX_EVENTS).filter((e) => e && typeof e === 'object' && isPublicPath(e.path)) : [];
  if (!events.length) return new NextResponse(null, { status: 204 });
  const meta = (body?.meta && typeof body.meta === 'object' ? body.meta : {}) as Record<string, unknown>;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return new NextResponse(null, { status: 429, headers: { 'Retry-After': '60' } });

  const ua = request.headers.get('user-agent') ?? '';
  const p_meta = {
    ref_host: str(meta.ref_host, 120),
    utm_source: str(meta.utm_source, 80),
    utm_medium: str(meta.utm_medium, 80),
    utm_campaign: str(meta.utm_campaign, 120),
    device: device(ua),
    country: str(request.headers.get('x-vercel-ip-country'), 8),
    region: str(request.headers.get('x-vercel-ip-country-region'), 16),
    is_bot: !ua || BOT.test(ua) || meta.webdriver === true,
    is_staff: request.cookies.get('mmd_staff')?.value === '1',
    is_preview: process.env.VERCEL_ENV !== 'production',
  };

  const p_key = process.env.ANALYTICS_INGEST_KEY;
  if (!p_key) {
    if (!warnedNoKey) { console.error('analytics: ANALYTICS_INGEST_KEY is not set; events are being dropped'); warnedNoKey = true; }
    return new NextResponse(null, { status: 503, headers: { 'X-Analytics-Error': 'configuration' } });
  }
  const { error } = await supabase().rpc('ingest_web_events', { p_events: events, p_meta, p_key });
  if (error) {
    if (error.code === '42501' || /invalid ingest key/i.test(error.message)) {
      if (!warnedNoKey) { console.error('analytics: ingestion credentials or permissions are invalid; check deployment configuration'); warnedNoKey = true; }
      return new NextResponse(null, { status: 503, headers: { 'X-Analytics-Error': 'configuration' } });
    }
    console.error('analytics: ingest failed:', error.message);
    return new NextResponse(null, { status: 503, headers: { 'Retry-After': '5' } });
  }
  return new NextResponse(null, { status: 204 });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

import type { createClient } from '@/lib/supabase/server';
import type { Range } from '@/lib/analytics/range';
import type { Role } from '@/lib/crm/nav';
import { readAll } from '@/lib/supabase/read-all';

/**
 * Reads for the Analytics screens. Everything runs as the signed-in member
 * through row-level security; the rollup tables carry the day-level numbers
 * and the raw tables answer the few questions that need them (behavior,
 * real-time). Counts are of received, validated, deduplicated events.
 */

export const ANALYTICS_ROLES: Role[] = ['admin', 'ops', 'leadership'];
/** The signed-in member's client (schema proj_mmd), as getSession() returns it. */
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const canSeeAnalytics = (role: Role | null) => role !== null && ANALYTICS_ROLES.includes(role);

type Daily = { day: string; sessions: number; page_views: number; cta_impressions: number; cta_clicks: number; contact_actions: number; form_starts: number; engaged_seconds: number; updated_at: string };
type DailyPage = { day: string; path: string; page_views: number; sessions: number; engaged_seconds: number };
type DailySource = { day: string; source: string; medium: string; sessions: number; page_views: number };
type DailyCta = { day: string; cta_id: string; placement_id: string; impressions: number; impression_sessions: number; clicks: number; click_sessions: number };
export type Annotation = { id: string; at: string; kind: string; title: string; detail: string | null };

export type Totals = {
  sessions: number; page_views: number; cta_impressions: number; cta_clicks: number;
  contact_actions: number; form_starts: number; engaged_seconds: number;
};
const zero = (): Totals => ({ sessions: 0, page_views: 0, cta_impressions: 0, cta_clicks: 0, contact_actions: 0, form_starts: 0, engaged_seconds: 0 });

function sum(rows: Daily[]): Totals {
  return rows.reduce((t, r) => ({
    sessions: t.sessions + r.sessions, page_views: t.page_views + r.page_views,
    cta_impressions: t.cta_impressions + r.cta_impressions, cta_clicks: t.cta_clicks + r.cta_clicks,
    contact_actions: t.contact_actions + r.contact_actions, form_starts: t.form_starts + r.form_starts,
    engaged_seconds: t.engaged_seconds + Number(r.engaged_seconds),
  }), zero());
}

export type Leads = {
  inquiries: number; bookings: number; applications: number; newsletter: number;
  /** Distinct measured sessions that produced at least one inquiry or booking. */
  convertedSessions: number;
  measuredSessions: number;
  /** Inquiries and bookings with no session link (blocked storage, direct entry, older rows). */
  unlinked: number;
};

async function leads(sb: SupabaseClient, fromIso: string, toIso: string): Promise<Leads & { error?: string }> {
  const { data, error } = await sb.rpc('web_lead_counts', { p_from: fromIso, p_to: toIso });
  const d = (data ?? {}) as Record<string, number>;
  return {
    inquiries: d.inquiries ?? 0,
    bookings: d.bookings ?? 0,
    applications: d.applications ?? 0,
    newsletter: d.newsletter ?? 0,
    convertedSessions: d.converted_sessions ?? 0,
    measuredSessions: d.measured_sessions ?? 0,
    unlinked: d.unlinked ?? 0,
    ...(error ? { error: error.message } : {}),
  };
}

export async function getHighlights(sb: SupabaseClient, r: Range) {
  const [cur, prev, pages, sources, ctas, notes, curLeads, prevLeads] = await Promise.all([
    sb.from('web_daily').select('*').gte('day', r.from).lte('day', r.to).order('day'),
    sb.from('web_daily').select('*').gte('day', r.prevFrom).lte('day', r.prevTo),
    readAll((from, to) => sb.from('web_daily_pages').select('*').gte('day', r.from).lte('day', r.to).order('day').order('path').range(from, to)),
    readAll((from, to) => sb.from('web_daily_sources').select('*').gte('day', r.from).lte('day', r.to).order('day').order('source').order('medium').range(from, to)),
    readAll((from, to) => sb.from('web_daily_ctas').select('*').gte('day', r.from).lte('day', r.to).order('day').order('cta_id').order('placement_id').range(from, to)),
    sb.from('web_annotations').select('id, at, kind, title, detail').gte('at', r.fromIso).lt('at', r.toIso).order('at', { ascending: false }).limit(20),
    leads(sb, r.fromIso, r.toIso),
    leads(sb, r.prevFromIso, r.prevToIso),
  ]);
  const daily = (cur.data ?? []) as Daily[];
  const updatedAt = daily.map((d) => d.updated_at).sort().at(-1) ?? null;

  const byPath = new Map<string, { path: string; page_views: number; sessions: number; engaged_seconds: number }>();
  for (const p of (pages.data ?? []) as DailyPage[]) {
    const cur = byPath.get(p.path) ?? { path: p.path, page_views: 0, sessions: 0, engaged_seconds: 0 };
    cur.page_views += p.page_views; cur.sessions += p.sessions; cur.engaged_seconds += Number(p.engaged_seconds);
    byPath.set(p.path, cur);
  }
  const bySource = new Map<string, { source: string; medium: string; sessions: number; page_views: number }>();
  for (const s of (sources.data ?? []) as DailySource[]) {
    const k = `${s.source}|${s.medium}`;
    const cur = bySource.get(k) ?? { source: s.source, medium: s.medium, sessions: 0, page_views: 0 };
    cur.sessions += s.sessions; cur.page_views += s.page_views;
    bySource.set(k, cur);
  }
  const byCta = new Map<string, DailyCta>();
  for (const c of (ctas.data ?? []) as DailyCta[]) {
    const k = `${c.cta_id}|${c.placement_id}`;
    const cur = byCta.get(k) ?? { ...c, impressions: 0, impression_sessions: 0, clicks: 0, click_sessions: 0 };
    cur.impressions += c.impressions; cur.impression_sessions += c.impression_sessions;
    cur.clicks += c.clicks; cur.click_sessions += c.click_sessions;
    byCta.set(k, cur);
  }

  return {
    totals: sum(daily),
    prevTotals: sum((prev.data ?? []) as Daily[]),
    daily,
    updatedAt,
    pages: [...byPath.values()].sort((a, b) => b.page_views - a.page_views),
    sources: [...bySource.values()].sort((a, b) => b.sessions - a.sessions),
    ctas: [...byCta.values()].sort((a, b) => b.clicks - a.clicks),
    annotations: (notes.data ?? []) as Annotation[],
    leads: curLeads,
    prevLeads,
    errors: [cur.error?.message, prev.error?.message, pages.error?.message, sources.error?.message, ctas.error?.message, notes.error?.message, curLeads.error, prevLeads.error].filter((m): m is string => Boolean(m)),
  };
}

export type Breakdown = {
  sessions: number;
  device: Record<string, number>;
  country: { k: string; n: number }[];
  region: { k: string; n: number }[];
  landing: { k: string; n: number }[];
  depth: Record<string, number>;
};
export async function getBreakdown(sb: SupabaseClient, r: Range): Promise<Breakdown | null> {
  const { data, error } = await sb.rpc('web_sessions_breakdown', { p_from: r.fromIso, p_to: r.toIso });
  if (error) return null;
  return data as Breakdown;
}

export type Behavior = {
  page_views: number;
  scroll: Record<string, number>;
  contact: Record<string, number>;
  forms: { form: string; starts: number; errors: number }[];
  video: { video: string; pct: string; n: number }[];
  slots: { slot: string; impressions: number; sessions: number }[];
  outbound: { host: string; n: number }[];
};
export async function getBehavior(sb: SupabaseClient, r: Range): Promise<Behavior | null> {
  const { data, error } = await sb.rpc('web_behavior', { p_from: r.fromIso, p_to: r.toIso });
  if (error) return null;
  return data as Behavior;
}

export type Realtime = {
  at: string;
  sessions: number;
  page_views: number;
  per_minute: { m: string; n: number }[];
  paths: { k: string; n: number }[];
  recent: { ts: string; event: string; path: string; props: Record<string, string | number> }[];
};
export async function getRealtime(sb: SupabaseClient): Promise<Realtime | null> {
  const { data, error } = await sb.rpc('web_realtime');
  if (error) return null;
  return data as Realtime;
}

/**
 * Report date ranges in office time (America/New_York). A range is a run of
 * whole days ending today; the previous period is the same number of days
 * immediately before it.
 */
export const TZ = 'America/New_York';

export type RangeKey = '7d' | '28d' | '90d';
export const RANGE_KEYS: RangeKey[] = ['7d', '28d', '90d'];
export const RANGE_LABEL: Record<RangeKey, string> = { '7d': 'Last 7 days', '28d': 'Last 28 days', '90d': 'Last 90 days' };

export type Range = {
  key: RangeKey;
  days: number;
  from: string;      // yyyy-mm-dd, inclusive
  to: string;        // yyyy-mm-dd, inclusive
  prevFrom: string;
  prevTo: string;
  fromIso: string;   // office midnight at the start of `from`
  toIso: string;     // office midnight after `to` (exclusive)
  prevFromIso: string;
  prevToIso: string;
};

/** Today's date in office time. */
export function todayYmd(now = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The instant of office midnight that starts the given day, as ISO. */
export function officeMidnightIso(ymd: string): string {
  // Start from the offset at noon, then check the offset in force at the
  // candidate midnight itself; on a DST change day the two can differ.
  const offsetAt = (d: Date) => {
    const v = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(d).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT-05:00';
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(v);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : -300;
  };
  const base = Date.parse(`${ymd}T00:00:00Z`);
  let candidate = new Date(base - offsetAt(new Date(`${ymd}T12:00:00Z`)) * 60_000);
  const again = offsetAt(candidate);
  if (new Date(base - again * 60_000).getTime() !== candidate.getTime()) candidate = new Date(base - again * 60_000);
  return candidate.toISOString();
}

export function parseRange(key: string | undefined, now = new Date()): Range {
  const k: RangeKey = (RANGE_KEYS as string[]).includes(key ?? '') ? (key as RangeKey) : '28d';
  const days = Number(k.replace('d', ''));
  const to = todayYmd(now);
  const from = addDays(to, -(days - 1));
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return {
    key: k, days, from, to, prevFrom, prevTo,
    fromIso: officeMidnightIso(from), toIso: officeMidnightIso(addDays(to, 1)),
    prevFromIso: officeMidnightIso(prevFrom), prevToIso: officeMidnightIso(from),
  };
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function shortDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function pct(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

export function delta(now: number, prev: number): { text: string; dir: 'up' | 'down' | 'flat' | 'none' } {
  if (!prev) return now ? { text: 'new', dir: 'none' } : { text: '—', dir: 'none' };
  const change = Math.round(((now - prev) / prev) * 100);
  if (change === 0) return { text: '0%', dir: 'flat' };
  return { text: `${change > 0 ? '+' : ''}${change}%`, dir: change > 0 ? 'up' : 'down' };
}

export function duration(seconds: number): string {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

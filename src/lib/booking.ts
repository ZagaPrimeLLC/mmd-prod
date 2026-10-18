import { site } from '@/lib/site';

// Consultations are held during the office walk-in window: Tuesdays and
// Thursdays, 11am to 4pm, New York time. Slots are generated from that rule
// every time the page opens, always covering the next few weeks from today, so
// nothing needs updating when the month changes.
export const SLOT_MINUTES = 45;
export const CONSULT_DAYS = [2, 4]; // Tue, Thu
export const CONSULT_START = 11 * 60; // minutes after midnight
export const CONSULT_END = 16 * 60;   // the last consultation finishes by 4pm
export const WEEKS_AHEAD = 3;
export const MIN_NOTICE_HOURS = 24;
export const OFFICE_TZ = 'America/New_York';

/**
 * One-off closures, as YYYY-MM-DD (e.g. a staff training day). Public holidays
 * are worked out automatically below and do not need listing here.
 */
export const CLOSED_DATES: string[] = [];

/** The published office schedule (CMS slot settings.office_hours). The constants above are its default. */
export type Schedule = { days: number[]; start: number; end: number; closed: string[]; unavailable?: boolean };
export const DEFAULT_SCHEDULE: Schedule = { days: CONSULT_DAYS, start: CONSULT_START, end: CONSULT_END, closed: CLOSED_DATES };

export type Slot = { iso: string; time: string };
export type Day = { key: string; label: string; slots: Slot[] };

type Ymd = { y: number; m: number; d: number };

/** The n-th given weekday of a month (1-based), or the last when n is -1. */
function nthWeekday(y: number, m: number, dow: number, n: number): number {
  if (n > 0) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return 1 + ((dow - first + 7) % 7) + (n - 1) * 7;
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lastDow = new Date(Date.UTC(y, m - 1, lastDay)).getUTCDay();
  return lastDay - ((lastDow - dow + 7) % 7);
}

/**
 * Federal holidays the office observes, whatever weekday they fall on, plus
 * Christmas Eve and New Year's Eve. One-off closures are in the published schedule.
 */
export function isHoliday({ y, m, d }: Ymd): boolean {
  const today = Date.UTC(y, m - 1, d);
  // Also check next year's New Year's Day, whose observed date can be Dec 31.
  for (const year of [y, y + 1]) {
    for (const [month, day] of [[1, 1], [6, 19], [7, 4], [11, 11], [12, 25]]) {
      const date = Date.UTC(year, month - 1, day);
      const dow = new Date(date).getUTCDay();
      const observed = date + (dow === 6 ? -1 : dow === 0 ? 1 : 0) * 864e5;
      if (today === date || today === observed) return true;
    }
  }
  if (m === 12 && (d === 24 || d === 31)) return true;
  if (m === 1 && d === nthWeekday(y, 1, 1, 3)) return true;   // Martin Luther King Jr. Day
  if (m === 2 && d === nthWeekday(y, 2, 1, 3)) return true;   // Presidents' Day
  if (m === 5 && d === nthWeekday(y, 5, 1, -1)) return true;  // Memorial Day
  if (m === 9 && d === nthWeekday(y, 9, 1, 1)) return true;   // Labor Day
  if (m === 10 && d === nthWeekday(y, 10, 1, 2)) return true; // Columbus Day
  if (m === 11 && d === nthWeekday(y, 11, 4, 4)) return true; // Thanksgiving
  return false;
}

/** Today's calendar date in New York, whatever timezone the visitor is in. */
function officeToday(now: Date): Ymd {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: OFFICE_TZ, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(now);
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: n('year'), m: n('month'), d: n('day') };
}

/** The real instant of a New York wall-clock time (handles daylight saving). */
function officeInstant({ y, m, d }: Ymd, minutes: number): Date {
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: OFFICE_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(new Date(guess));
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asIfUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'));
  return new Date(guess - (asIfUtc - guess));
}

function ordinal(d: number): string {
  const s = d % 100 >= 11 && d % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] ?? 'th';
  return `${d}${s}`;
}

export const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Tuesday 6th", with "This" / "Next" so nobody has to work out which week. */
export function dayLabel(date: Ymd, today: Ymd): string {
  const dow = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
  const diff = Math.round((Date.UTC(date.y, date.m - 1, date.d) - Date.UTC(today.y, today.m - 1, today.d)) / 864e5);
  const todayDow = new Date(Date.UTC(today.y, today.m - 1, today.d)).getUTCDay();
  const base = `${WEEKDAY[dow]} ${ordinal(date.d)}`;
  if (diff === 1) return `Tomorrow, ${base}`;
  if (diff < 7 - todayDow) return `This ${base}`;
  if (diff < 14 - todayDow) return `Next ${base}`;
  return base;
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: OFFICE_TZ, hour: 'numeric', minute: '2-digit' });
}

/** The yyyy-mm-dd key used in CLOSED_DATES. */
export function ymdKey({ y, m, d }: Ymd): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** A day the office takes consultations and walk-ins: a consult weekday that is not a holiday or a one-off closure. */
export function isOfficeOpenDay(ymd: Ymd, dow: number, s: Schedule): boolean {
  return s.days.includes(dow) && !isHoliday(ymd) && !s.closed.includes(ymdKey(ymd));
}

/** "11am", "4pm", "4:30pm" from minutes after midnight. */
export function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
}

/** Shared public schedule text, derived from the same rule as available slots. */
export function officeHoursLabel(s: Schedule): string {
  if (s.unavailable) return `please call ${site.phone} to confirm current hours`;
  const days = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' })
    .format(s.days.map((day) => `${WEEKDAY[day]}s`));
  return `${days}, ${clockLabel(s.start)} to ${clockLabel(s.end)}`;
}

export function availableDays(now: Date, s: Schedule): Day[] {
  const today = officeToday(now);
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 3600_000;
  const days: Day[] = [];

  for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
    const cal = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const ymd = { y: cal.getUTCFullYear(), m: cal.getUTCMonth() + 1, d: cal.getUTCDate() };
    const key = ymdKey(ymd);
    if (!isOfficeOpenDay(ymd, cal.getUTCDay(), s)) continue;

    const slots: Slot[] = [];
    for (let t = s.start; t + SLOT_MINUTES <= s.end; t += SLOT_MINUTES) {
      const at = officeInstant(ymd, t);
      if (at.getTime() < earliest) continue;
      slots.push({ iso: at.toISOString(), time: timeLabel(at.toISOString()) });
    }
    if (slots.length) days.push({ key, label: dayLabel(ymd, today), slots });
  }
  return days;
}

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { OFFICE_TZ, WEEKDAY, isOfficeOpenDay, clockLabel, officeHoursLabel, type Schedule } from '@/lib/booking';

/**
 * Whether the South Plainfield office is open for walk-ins right now, in New
 * York time. Walk-in hours are the consultation hours in lib/booking, so a
 * changed schedule, a holiday or a one-off closure shows here as well.
 * The server renders the plain hours; the live answer appears once the page
 * runs in a browser, and refreshes every minute.
 */

function officeNow(d: Date) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: OFFICE_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(d);
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const y = n('year'), m = n('month'), day = n('day');
  return { y, m, d: day, dow: new Date(Date.UTC(y, m - 1, day)).getUTCDay(), minutes: n('hour') * 60 + n('minute') };
}

export function walkInText(now: Date, s: Schedule): { open: boolean; text: string } {
  const hours = `${clockLabel(s.start)} to ${clockLabel(s.end)}`;
  const t = officeNow(now);
  if (isOfficeOpenDay(t, t.dow, s) && t.minutes >= s.start && t.minutes < s.end) {
    return { open: true, text: `Open for walk-ins now, until ${clockLabel(s.end)}` };
  }
  for (let i = 0; i < 14; i++) {
    const c = new Date(Date.UTC(t.y, t.m - 1, t.d + i));
    const ymd = { y: c.getUTCFullYear(), m: c.getUTCMonth() + 1, d: c.getUTCDate() };
    if (!isOfficeOpenDay(ymd, c.getUTCDay(), s)) continue;
    if (i === 0 && t.minutes >= s.start) continue;
    const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : WEEKDAY[c.getUTCDay()];
    return { open: false, text: `Next walk-in ${when}, ${hours}` };
  }
  return { open: false, text: `Walk-in hours: ${officeHoursLabel(s)}` };
}

const noop = () => () => {};

export default function WalkInStatus({ className = '', schedule }: { className?: string; schedule: Schedule }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!inBrowser) return;
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [inBrowser]);

  const status = now ? walkInText(now, schedule) : null;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${status?.open ? 'bg-emerald-600 motion-safe:animate-pulse' : 'bg-gold'}`}
      />
      {status ? status.text : `Walk-in hours: ${officeHoursLabel(schedule)}`}
    </span>
  );
}

import Link from 'next/link';
import { RANGE_KEYS, RANGE_LABEL, delta as calc, type RangeKey } from '@/lib/analytics/range';

/** Period picker: plain links, so it works without script and is bookmarkable. */
export function RangePicker({ current, base }: { current: RangeKey; base: string }) {
  return (
    <nav aria-label="Period" className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {RANGE_KEYS.map((k) => (
        <Link
          key={k}
          href={`${base}?range=${k}`}
          aria-current={k === current ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold ${k === current ? 'bg-white text-navy-deep shadow-sm' : 'text-slate-600 hover:text-navy-deep'}`}
        >
          {RANGE_LABEL[k]}
        </Link>
      ))}
    </nav>
  );
}

/** Change against the previous period, with the arrow colour saying which way is good. */
export function Delta({ now, prev, invert = false }: { now: number; prev: number; invert?: boolean }) {
  const d = calc(now, prev);
  const good = d.dir === (invert ? 'down' : 'up');
  const bad = d.dir === (invert ? 'up' : 'down');
  return (
    <span className={`text-xs font-semibold tabular-nums ${good ? 'text-emerald-700' : bad ? 'text-red-700' : 'text-slate-500'}`}>
      {d.text}
      <span className="ml-1 font-normal text-slate-400">vs previous</span>
    </span>
  );
}

/**
 * A bar per day. The table underneath is the accessible version; the SVG is
 * decoration for sighted readers.
 */
export function Bars({ series, label, height = 120 }: { series: { k: string; v: number; title?: string }[]; label: string; height?: number }) {
  const max = Math.max(1, ...series.map((s) => s.v));
  const w = 100 / Math.max(series.length, 1);
  return (
    <figure>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-28 w-full" aria-hidden>
        {series.map((s, i) => {
          const h = Math.max(s.v ? 2 : 0, (s.v / max) * (height - 4));
          return <rect key={s.k} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx={1} className="fill-navy/80" />;
        })}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
      <table className="sr-only">
        <thead><tr><th>Day</th><th>{label}</th></tr></thead>
        <tbody>{series.map((s) => <tr key={s.k}><td>{s.title ?? s.k}</td><td>{s.v}</td></tr>)}</tbody>
      </table>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{series[0]?.title ?? series[0]?.k}</span>
        <span>{series.at(-1)?.title ?? series.at(-1)?.k}</span>
      </div>
    </figure>
  );
}

/** A ranked list with a proportional bar: pages, sources, countries. */
export function RankList({ rows, valueLabel, empty = 'Nothing recorded yet.' }: {
  rows: { k: string; v: number; sub?: string; href?: string }[]; valueLabel: string; empty?: string;
}) {
  if (!rows.length) return <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <table className="w-full text-sm">
      <thead className="sr-only"><tr><th>Item</th><th>{valueLabel}</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.k + (r.sub ?? '')} className="border-t border-slate-100 first:border-0">
            <td className="px-5 py-2.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate font-medium text-navy-deep">
                  {r.href ? <Link href={r.href} className="hover:underline">{r.k}</Link> : r.k}
                  {r.sub && <span className="ml-2 text-xs font-normal text-slate-500">{r.sub}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-slate-700">{r.v.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-navy/70" style={{ width: `${(r.v / max) * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Definitions shown under a report so a number is never read the wrong way. */
export function Definitions({ items }: { items: [string, string][] }) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm">
      <summary className="cursor-pointer font-semibold text-navy-deep">How these numbers are counted</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(([t, d]) => (
          <div key={t}><dt className="font-semibold text-slate-800">{t}</dt><dd className="text-slate-600">{d}</dd></div>
        ))}
      </dl>
    </details>
  );
}

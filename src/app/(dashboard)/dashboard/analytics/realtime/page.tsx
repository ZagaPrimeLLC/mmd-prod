import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Notice, ago } from '@/components/crm/ui';
import { Bars, RankList } from '@/components/crm/analytics/Charts';
import AutoRefresh from '@/components/crm/analytics/AutoRefresh';
import { getSession } from '@/lib/crm/session';
import { canSeeAnalytics, getRealtime } from '@/lib/analytics/read';
import { TZ } from '@/lib/analytics/range';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Real-time' };

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

export default async function RealtimePage() {
  const { supabase, role } = await getSession();
  if (!canSeeAnalytics(role)) {
    return (<><PageHeader title="Real-time" /><div className="p-5 sm:p-8"><Notice>Website analytics are available to admin, ops and leadership.</Notice></div></>);
  }
  const rt = await getRealtime(supabase);

  // One bar per minute for the last 30 minutes, including empty ones.
  const minutes: { k: string; v: number; title: string }[] = [];
  if (rt) {
    const by = new Map(rt.per_minute.map((x) => [new Date(x.m).getTime(), x.n]));
    const end = Math.floor(new Date(rt.at).getTime() / 60_000) * 60_000;
    for (let i = 29; i >= 0; i--) {
      const m = end - i * 60_000;
      minutes.push({ k: String(m), v: by.get(m) ?? 0, title: clock(new Date(m).toISOString()) });
    }
  }

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader title="Real-time" lead="Sessions with activity in the last 30 minutes. This is a rolling window of received events, not a count of people online right now." />
      <div className="space-y-6 p-5 sm:p-8">
        {!rt ? <Notice tone="warn">Real-time data could not be loaded.</Notice> : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-semibold text-slate-600">Active sessions, last 30 min</p><p className="mt-2 text-3xl font-bold tabular-nums text-navy-deep">{rt.sessions}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-semibold text-slate-600">Page views, last 30 min</p><p className="mt-2 text-3xl font-bold tabular-nums text-navy-deep">{rt.page_views}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-semibold text-slate-600">Refreshed</p><p className="mt-2 text-lg font-bold text-navy-deep">{clock(rt.at)}</p><p className="text-xs text-slate-500">updates every 30 seconds while this tab is open</p></div>
            </div>
            <Card>
              <CardHead title="Page views per minute" />
              <div className="px-5 py-4"><Bars label="Page views" series={minutes} /></div>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHead title="Pages with activity" sub="sessions per page in the window" />
                <RankList valueLabel="Sessions" rows={rt.paths.map((x) => ({ k: x.k, v: x.n }))} empty="Quiet right now." />
              </Card>
              <Card>
                <CardHead title="Latest events" />
                {rt.recent.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">Quiet right now.</p> : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {rt.recent.map((e, i) => (
                      <li key={i} className="flex items-baseline gap-3 px-5 py-2">
                        <span className="w-14 shrink-0 text-xs tabular-nums text-slate-500">{ago(e.ts)}</span>
                        <span className="font-medium text-navy-deep">{e.event.replace('_', ' ')}</span>
                        <span className="truncate text-slate-600">{e.path}</span>
                        {e.props && Object.keys(e.props).length > 0 && (
                          <span className="ml-auto truncate text-xs text-slate-500">{Object.entries(e.props).map(([k, v]) => `${k}=${v}`).join(' ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}

import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Notice } from '@/components/crm/ui';
import { RangePicker, RankList, Definitions } from '@/components/crm/analytics/Charts';
import { getSession } from '@/lib/crm/session';
import { canSeeAnalytics, getHighlights, getBehavior } from '@/lib/analytics/read';
import { parseRange, pct, duration } from '@/lib/analytics/range';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Behavior' };

export default async function BehaviorPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase, role } = await getSession();
  if (!canSeeAnalytics(role)) {
    return (<><PageHeader title="Behavior" /><div className="p-5 sm:p-8"><Notice>Website analytics are available to admin, ops and leadership.</Notice></div></>);
  }
  const r = parseRange((await searchParams).range);
  const [h, b] = await Promise.all([getHighlights(supabase, r), getBehavior(supabase, r)]);
  const views = b?.page_views ?? h.totals.page_views;

  const videoRows = Object.values((b?.video ?? []).reduce<Record<string, { k: string; v: number; sub: string }>>((acc, x) => {
    const done = Number(x.pct) === 100 ? x.n : 0;
    const cur = acc[x.video] ?? { k: x.video, v: 0, sub: '' };
    cur.v += done;
    acc[x.video] = cur;
    return acc;
  }, {})).map((x) => ({ ...x, sub: 'played to the end' }));

  return (
    <>
      <PageHeader title="Behavior" lead="What people saw and did on the pages." actions={<RangePicker current={r.key} base="/dashboard/analytics/behavior" />} />
      <div className="space-y-6 p-5 sm:p-8">
        {h.errors.length > 0 && <Notice tone="warn">Some behavior data could not be loaded: {h.errors.join('; ')}</Notice>}
        {!b && <Notice tone="warn">Behavior breakdowns could not be loaded. Empty charts below do not mean there was no activity.</Notice>}
        <Card>
          <CardHead title="Calls to action" sub="Click-through is sessions that both saw and clicked it ÷ sessions that saw it (on screen at least one second, counted per day)." />
          {h.ctas.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">Nothing recorded yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr><th className="px-5 py-2 font-semibold">Call to action</th><th className="px-3 py-2 font-semibold">Placement</th><th className="px-3 py-2 text-right font-semibold">Seen by</th><th className="px-3 py-2 text-right font-semibold">Clicked by</th><th className="px-5 py-2 text-right font-semibold">Click-through</th></tr>
                </thead>
                <tbody>
                  {h.ctas.map((c) => (
                    <tr key={`${c.cta_id}|${c.placement_id}`} className="border-t border-slate-100">
                      <td className="px-5 py-2.5 font-medium text-navy-deep">{c.cta_id}</td>
                      <td className="px-3 py-2.5 text-slate-600">{c.placement_id}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.impression_sessions.toLocaleString()} <span className="text-xs text-slate-500">sessions</span></td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{c.click_sessions.toLocaleString()} <span className="text-xs text-slate-500">sessions</span></td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-navy-deep">{pct(c.click_sessions, c.impression_sessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Sections seen" sub="registered sections on screen for at least one second" />
            <RankList valueLabel="Impressions" rows={(b?.slots ?? []).map((x) => ({ k: x.slot, v: x.impressions, sub: `${x.sessions} sessions` }))} />
          </Card>
          <Card>
            <CardHead title="Scroll depth" sub={`share of ${views.toLocaleString()} page views reaching each point`} />
            <RankList valueLabel="Page views" rows={['25', '50', '75', '100'].map((d) => ({ k: `${d}% of the page`, v: b?.scroll?.[d] ?? 0, sub: pct(b?.scroll?.[d] ?? 0, views) }))} />
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHead title="Contact taps" sub="a tap on a phone, email or WhatsApp link" />
            <RankList valueLabel="Taps" rows={Object.entries(b?.contact ?? {}).map(([k, v]) => ({ k, v })).sort((a, c) => c.v - a.v)} />
          </Card>
          <Card>
            <CardHead title="Forms" sub="started, and submits that failed" />
            <RankList valueLabel="Starts" rows={(b?.forms ?? []).map((f) => ({ k: f.form, v: f.starts, sub: f.errors ? `${f.errors} failed submits` : undefined }))} />
          </Card>
          <Card>
            <CardHead title="Videos" sub="loops played to the end" />
            <RankList valueLabel="Completions" rows={videoRows} />
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Time on page" sub="engaged seconds per view: tab visible and the visitor active" />
            <RankList valueLabel="Engaged time" rows={h.pages.filter((p) => p.page_views >= 3).map((p) => ({ k: p.path, v: Math.round(p.engaged_seconds / p.page_views), sub: duration(Math.round(p.engaged_seconds / p.page_views)) })).sort((a, c) => c.v - a.v).slice(0, 10)} />
          </Card>
          <Card>
            <CardHead title="Links out" sub="other sites people left for" />
            <RankList valueLabel="Clicks" rows={(b?.outbound ?? []).map((x) => ({ k: x.host, v: x.n }))} empty="No outbound clicks recorded." />
          </Card>
        </div>

        <Definitions items={[
          ['Impression', 'A registered section or call to action at least half visible for one continuous second while the tab was visible. Counted once per page view.'],
          ['Form start', 'The first time a visitor interacts with a form on a page view. Never what they typed.'],
          ['Failed submit', 'A submit the server rejected. Only the category is recorded.'],
          ['Engaged time', 'Seconds the tab was visible and the visitor had touched, scrolled or typed within the last 15 seconds. Capped per view.'],
        ]} />
      </div>
    </>
  );
}

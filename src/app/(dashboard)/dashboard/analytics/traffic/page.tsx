import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Notice } from '@/components/crm/ui';
import { RangePicker, Bars, RankList, Definitions } from '@/components/crm/analytics/Charts';
import { getSession } from '@/lib/crm/session';
import { canSeeAnalytics, getHighlights, getBreakdown } from '@/lib/analytics/read';
import { parseRange, eachDay, shortDay } from '@/lib/analytics/range';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Traffic' };

const DEVICE_LABEL: Record<string, string> = { desktop: 'Desktop', mobile: 'Phone', tablet: 'Tablet', unknown: 'Unknown' };

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase, role } = await getSession();
  if (!canSeeAnalytics(role)) {
    return (<><PageHeader title="Traffic" /><div className="p-5 sm:p-8"><Notice>Website analytics are available to admin, ops and leadership.</Notice></div></>);
  }
  const r = parseRange((await searchParams).range);
  const [h, b] = await Promise.all([getHighlights(supabase, r), getBreakdown(supabase, r)]);
  const days = eachDay(r.from, r.to);
  const byDay = new Map(h.daily.map((d) => [d.day, d]));
  const asRows = (o: Record<string, number> | undefined, label?: Record<string, string>) =>
    Object.entries(o ?? {}).map(([k, v]) => ({ k: label?.[k] ?? k, v })).sort((a, c) => c.v - a.v);

  return (
    <>
      <PageHeader title="Traffic" lead="Where sessions start, what they land on and what they use." actions={<RangePicker current={r.key} base="/dashboard/analytics/traffic" />} />
      <div className="space-y-6 p-5 sm:p-8">
        {h.errors.length > 0 && <Notice tone="warn">Some traffic data could not be loaded: {h.errors.join('; ')}</Notice>}
        {!b && <Notice tone="warn">Traffic breakdowns could not be loaded. Empty charts below do not mean there were no visits.</Notice>}
        <Card>
          <CardHead title="Sessions by day" sub={`${h.totals.sessions.toLocaleString()} sessions, ${h.totals.page_views.toLocaleString()} page views`} />
          <div className="px-5 py-4"><Bars label="Sessions" series={days.map((d) => ({ k: d, title: shortDay(d), v: byDay.get(d)?.sessions ?? 0 }))} /></div>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Sources" sub="utm_source and utm_medium when a link carried them; otherwise the referring site; otherwise direct" />
            <RankList valueLabel="Sessions" rows={h.sources.slice(0, 15).map((x) => ({ k: x.source, sub: x.medium, v: x.sessions }))} />
          </Card>
          <Card>
            <CardHead title="Landing pages" sub="the first page of each session" />
            <RankList valueLabel="Sessions" rows={(b?.landing ?? []).map((x) => ({ k: x.k, v: x.n }))} />
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHead title="Devices" />
            <RankList valueLabel="Sessions" rows={asRows(b?.device, DEVICE_LABEL)} />
          </Card>
          <Card>
            <CardHead title="US states" sub="from the hosting provider's request headers; approximate" />
            <RankList valueLabel="Sessions" rows={(b?.region ?? []).map((x) => ({ k: x.k, v: x.n }))} />
          </Card>
          <Card>
            <CardHead title="Pages per session" />
            <RankList valueLabel="Sessions" rows={asRows(b?.depth).sort((a, c) => a.k.localeCompare(c.k))} />
          </Card>
        </div>
        <Card>
          <CardHead title="Countries" />
          <RankList valueLabel="Sessions" rows={(b?.country ?? []).map((x) => ({ k: x.k, v: x.n }))} />
        </Card>
        <Definitions items={[
          ['Direct', 'No referring site and no campaign tags. Includes typed addresses, bookmarks, most messaging apps and visitors whose browser hides the referrer.'],
          ['Referral', 'Another website linked here. Only the site name is kept.'],
          ['Location', 'Country and state as reported by the hosting provider for the request. Never stored with the address itself.'],
        ]} />
      </div>
    </>
  );
}

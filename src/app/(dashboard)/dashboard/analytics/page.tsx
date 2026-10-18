import { Users, Eye, MousePointerClick, Inbox, Clock, Phone } from 'lucide-react';
import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Stat, Notice, ago } from '@/components/crm/ui';
import { RangePicker, Delta, Bars, RankList, Definitions } from '@/components/crm/analytics/Charts';
import { getSession } from '@/lib/crm/session';
import { canSeeAnalytics, getHighlights } from '@/lib/analytics/read';
import { parseRange, eachDay, shortDay, pct, duration } from '@/lib/analytics/range';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics' };

export default async function HighlightsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase, role } = await getSession();
  if (!canSeeAnalytics(role)) {
    return (
      <>
        <PageHeader title="Analytics" />
        <div className="p-5 sm:p-8"><Notice>Website analytics are available to admin, ops and leadership.</Notice></div>
      </>
    );
  }
  const r = parseRange((await searchParams).range);
  const h = await getHighlights(supabase, r);
  const t = h.totals, p = h.prevTotals;
  const days = eachDay(r.from, r.to);
  const byDay = new Map(h.daily.map((d) => [d.day, d]));
  const requests = h.leads.inquiries + h.leads.bookings;
  const prevRequests = h.prevLeads.inquiries + h.prevLeads.bookings;

  return (
    <>
      <PageHeader
        title="Highlights"
        lead="What the website did for the business in this period. Counts are received, validated, deduplicated events; staff visits, bots and previews are excluded."
        actions={<RangePicker current={r.key} base="/dashboard/analytics" />}
      />
      <div className="space-y-6 p-5 sm:p-8">
        {h.errors.length > 0 && <Notice tone="warn">Some numbers could not be loaded: {h.errors.join('; ')}</Notice>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Sessions" value={t.sessions.toLocaleString()} icon={Users} sub={undefined} />
          <Stat label="Page views" value={t.page_views.toLocaleString()} icon={Eye} />
          <Stat label="Care requests saved" value={requests.toLocaleString()} icon={Inbox} tone="good"
            sub={`${h.leads.inquiries} inquiries, ${h.leads.bookings} bookings`} href="/dashboard/inbox" />
          <Stat label="CTA click-through" value={pct(h.ctas.reduce((a, c) => a + c.click_sessions, 0), h.ctas.reduce((a, c) => a + c.impression_sessions, 0))} icon={MousePointerClick}
            sub="sessions that saw and clicked ÷ sessions that saw, per CTA and day" />
          <Stat label="Phone, email, WhatsApp taps" value={t.contact_actions.toLocaleString()} icon={Phone} sub="a tap, not a confirmed call" />
          <Stat label="Engaged time per session" value={duration(t.sessions ? t.engaged_seconds / t.sessions : 0)} icon={Clock} sub="tab visible and active" />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-1">
          <span className="text-xs text-slate-600">Sessions <Delta now={t.sessions} prev={p.sessions} /></span>
          <span className="text-xs text-slate-600">Page views <Delta now={t.page_views} prev={p.page_views} /></span>
          <span className="text-xs text-slate-600">Care requests <Delta now={requests} prev={prevRequests} /></span>
          <span className="text-xs text-slate-600">Contact taps <Delta now={t.contact_actions} prev={p.contact_actions} /></span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Page views by day" sub={h.updatedAt ? `Rollup updated ${ago(h.updatedAt)}; today refreshes every 10 minutes` : 'No days rolled up yet'} />
            <div className="px-5 py-4">
              <Bars label="Page views" series={days.map((d) => ({ k: d, title: shortDay(d), v: byDay.get(d)?.page_views ?? 0 }))} />
            </div>
          </Card>
          <Card>
            <CardHead title="Sessions by day" />
            <div className="px-5 py-4">
              <Bars label="Sessions" series={days.map((d) => ({ k: d, title: shortDay(d), v: byDay.get(d)?.sessions ?? 0 }))} />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Top pages" sub="by page views" />
            <RankList valueLabel="Page views" rows={h.pages.slice(0, 10).map((x) => ({ k: x.path, v: x.page_views, sub: `${x.sessions} sessions` }))} />
          </Card>
          <Card>
            <CardHead title="Where sessions came from" sub="utm_source, else the referring site, else direct" />
            <RankList valueLabel="Sessions" rows={h.sources.slice(0, 10).map((x) => ({ k: x.source, sub: x.medium, v: x.sessions }))} />
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead title="Requests from measured sessions" sub="the join between a visit and a saved record" />
            <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-sm">
              <div><dt className="text-slate-500">Sessions with a saved request</dt><dd className="text-2xl font-bold tabular-nums text-navy-deep">{h.leads.convertedSessions}</dd></div>
              <div><dt className="text-slate-500">Rate of measured sessions</dt><dd className="text-2xl font-bold tabular-nums text-navy-deep">{pct(h.leads.convertedSessions, h.leads.measuredSessions)}</dd></div>
              <div><dt className="text-slate-500">Requests without a session link</dt><dd className="text-2xl font-bold tabular-nums text-navy-deep">{h.leads.unlinked}</dd></div>
              <div><dt className="text-slate-500">Recruitment (reported separately)</dt><dd className="text-2xl font-bold tabular-nums text-navy-deep">{h.leads.applications}<span className="ml-2 text-xs font-normal text-slate-500">applications</span></dd></div>
            </dl>
            <p className="px-5 pb-4 text-xs text-slate-500">Newsletter sign-ups in this period: {h.leads.newsletter}. Blocked storage or a direct entry leaves a request unlinked; it still counts as a request.</p>
          </Card>
          <Card>
            <CardHead title="What changed" sub="publishes, campaigns and notes in this period" />
            {h.annotations.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No annotations in this period. Publishing content from the CMS will add one automatically.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {h.annotations.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <span className="font-medium text-navy-deep">{a.title}</span>
                    <span className="ml-2 text-xs text-slate-500">{a.kind} · {ago(a.at)}</span>
                    {a.detail && <p className="mt-0.5 text-xs text-slate-600">{a.detail}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Definitions items={[
          ['Session', 'Activity in one browser tab, renewed after 30 minutes without activity. A new tab is a new session. Not a count of people.'],
          ['Page view', 'One load of a public page, including moving between pages without a reload. A reload is a new view.'],
          ['CTA click-through', 'Sessions that both saw and clicked a call to action, divided by sessions that saw it for at least a second. Counted per CTA, placement and day; quick clicks without a qualifying impression are excluded from this rate.'],
          ['Rate of measured sessions', 'Of measured sessions that started in this period, the share that saved a care inquiry or booking during the same period. General careers applications are recruitment and do not count as care requests.'],
          ['Care requests saved', 'Inquiries and consultation bookings actually written to the CRM. Clicks and form starts never count.'],
          ['Previous period', 'The same number of days immediately before this period. MMD compares with itself; there are no outside benchmarks.'],
          ['Excluded', 'Visits from signed-in staff, known bots, local development and preview deployments. Visitors who block scripts are not counted at all.'],
        ]} />
      </div>
    </>
  );
}

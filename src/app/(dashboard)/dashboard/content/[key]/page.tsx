import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Notice, Pill, ago } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import { slotByKey, isProtected, validate, type BlockType, type Content } from '@/lib/cms/slots';
import { WEEKDAY, clockLabel } from '@/lib/booking';
import { saveDraft, setStatus, publish } from '../actions';

export const dynamic = 'force-dynamic';

type Rev = { id: string; status: string; note: string | null; author_id: string; created_at: string; published_at: string | null; published_by: string | null; content: unknown };

const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy';
const label = 'block text-xs font-semibold text-slate-700';
const btn = 'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold';
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** The edit fields for one block type, pre-filled with the current content. */
function Fields({ type, c }: { type: BlockType; c: Content[BlockType] }) {
  switch (type) {
    case 'text': return <label className={label}>Text<input name="text" defaultValue={(c as Content['text']).text} maxLength={400} className={field} required /></label>;
    case 'heroTitle': { const v = c as Content['heroTitle']; return (<div className="grid gap-3 sm:grid-cols-2">
      <label className={label}>White part<input name="lead" defaultValue={v.lead} maxLength={80} className={field} required /></label>
      <label className={label}>Gold part<input name="accent" defaultValue={v.accent} maxLength={60} className={field} /></label></div>); }
    case 'cta': { const v = c as Content['cta']; return (<div className="grid gap-3 sm:grid-cols-2">
      <label className={label}>Button label<input name="label" defaultValue={v.label} maxLength={60} className={field} required /></label>
      <label className={label}>Opens<input name="href" defaultValue={v.href} maxLength={200} className={field} placeholder="/contact#book" required /></label></div>); }
    case 'paragraphs': return <label className={label}>Paragraphs (separate with a blank line)<textarea name="paragraphs" rows={8} defaultValue={(c as Content['paragraphs']).paragraphs.join('\n\n')} className={field} required /></label>;
    case 'list': return <label className={label}>Items, one per line<textarea name="items" rows={4} defaultValue={(c as Content['list']).items.join('\n')} className={field} required /></label>;
    case 'faq': return <label className={label}>Questions and answers (Q: … / A: …, blank line between)<textarea name="items" rows={14} defaultValue={(c as Content['faq']).items.map((x) => `Q: ${x.q}\nA: ${x.a}`).join('\n\n')} className={field} required /></label>;
    case 'announcement': { const v = c as Content['announcement']; return (<div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
      <label className={label}>Notice (leave empty to hide the bar)<input name="text" defaultValue={v.text} maxLength={160} className={field} /></label>
      <label className={label}>Link (optional)<input name="href" defaultValue={v.href} maxLength={200} className={field} placeholder="/contact" /></label></div>); }
    case 'schedule': { const v = c as Content['schedule']; return (<div className="space-y-4">
      <fieldset><legend className={label}>Days</legend><div className="mt-1 flex flex-wrap gap-3 text-sm">
        {WEEKDAY.map((d, i) => <label key={d} className="inline-flex items-center gap-1.5"><input type="checkbox" name="days" value={i} defaultChecked={v.days.includes(i)} />{d}</label>)}</div></fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Opens<input type="time" name="start" defaultValue={toTime(v.start)} step={900} className={field} required /></label>
        <label className={label}>Closes<input type="time" name="end" defaultValue={toTime(v.end)} step={900} className={field} required /></label></div>
      <label className={label}>Additional closed dates, one per line (YYYY-MM-DD). The holidays and company closures listed above are automatic.<textarea name="closed" rows={4} defaultValue={v.closed.join('\n')} className={field} /></label></div>); }
  }
}

/** A short, readable rendering of stored content for the revision list. */
function Summary({ type, c }: { type: BlockType; c: unknown }) {
  const v = validate(type, c);
  if (!v.ok) return <span className="text-red-700">Invalid content: {v.error}</span>;
  const x = v.content as Record<string, unknown>;
  switch (type) {
    case 'text': case 'announcement': return <>{String(x.text) || <em className="text-slate-500">empty</em>}{x.href ? <span className="text-slate-500"> → {String(x.href)}</span> : null}</>;
    case 'heroTitle': return <>{String(x.lead)} <span className="text-gold-deep">{String(x.accent)}</span></>;
    case 'cta': return <>{String(x.label)} <span className="text-slate-500">→ {String(x.href)}</span></>;
    case 'paragraphs': return <>{(x.paragraphs as string[]).length} paragraphs: “{(x.paragraphs as string[])[0].slice(0, 90)}…”</>;
    case 'list': return <>{(x.items as string[]).join(' · ')}</>;
    case 'faq': return <>{(x.items as { q: string }[]).length} questions: “{(x.items as { q: string }[])[0].q}”</>;
    case 'schedule': { const s = v.content as Content['schedule']; return <>{s.days.map((d) => WEEKDAY[d].slice(0, 3)).join(', ')} {clockLabel(s.start)}–{clockLabel(s.end)}{s.closed.length ? `, closed ${s.closed.join(', ')}` : ''}</>; }
  }
}

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
  in_review: { label: 'Awaiting review', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  published: { label: 'Live', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  archived: { label: 'Earlier version', tone: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

export default async function SlotPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const key = decodeURIComponent((await params).key);
  const def = slotByKey(key);
  if (!def) notFound();
  const sp = await searchParams;
  const { supabase, user, role } = await getSession();
  const writes = canWrite(role) && (!isProtected(key) || role === 'admin');
  const admin = role === 'admin';

  const [{ data: revData, error: historyError }, { data: profiles }, { data: liveData, error: liveError }] = await Promise.all([
    supabase.from('cms_revisions').select('id, status, note, author_id, created_at, published_at, published_by, content').eq('slot_key', key).order('created_at', { ascending: false }).limit(30),
    supabase.from('profiles').select('id, display_name'),
    supabase.from('cms_revisions').select('id, status, note, author_id, created_at, published_at, published_by, content').eq('slot_key', key).eq('status', 'published').maybeSingle(),
  ]);
  const revs = (revData ?? []) as Rev[];
  const who = new Map((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name]));
  if (liveError || historyError) {
    return <div className="p-6"><Notice tone="warn">Content could not be loaded. Please reload before editing.</Notice></div>;
  }
  const live = liveData as Rev | null;
  const liveValid = live ? validate(def.type, live.content) : null;
  const current = (liveValid && liveValid.ok ? liveValid.content : def.default) as Content[BlockType];
  const previewPath = def.paths[0] ?? '/';

  return (
    <>
      <PageHeader
        title={def.label}
        lead={def.help}
        actions={<Link href="/dashboard/content" className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>All content</Link>}
      />
      <div className="space-y-6 p-5 sm:p-8">
        {sp.ok && <Notice>{sp.ok}</Notice>}
        {sp.err && <Notice tone="warn">{sp.err}</Notice>}
        {!writes && <Notice>{isProtected(key) ? 'Only an administrator can change this setting.' : 'You can read this content but not edit it.'}</Notice>}

        {live && liveValid && !liveValid.ok && (
          <Notice tone="warn">
            The live version of this content is invalid ({liveValid.error}), so the website cannot show it. Publish a corrected
            version or restore an earlier one below.
          </Notice>
        )}
        <Card>
          <CardHead title={live ? (liveValid && !liveValid.ok ? 'Live now (invalid, not shown on the website)' : 'Live now') : 'Live now (built-in text, nothing published yet)'} sub={live ? `Published ${ago(live.published_at)} by ${who.get(live.published_by ?? '') ?? 'an administrator'}` : undefined} />
          <p className="px-5 py-4 text-sm text-slate-800"><Summary type={def.type} c={current} /></p>
        </Card>

        {writes && (
          <Card>
            <CardHead title="New draft" sub="Starts from what is live. Saving never changes the website until an administrator publishes." />
            <form action={saveDraft} className="space-y-4 px-5 py-4">
              <input type="hidden" name="key" value={key} />
              <Fields type={def.type} c={current} />
              <label className={label}>Note for the reviewer (optional)<input name="note" maxLength={200} className={field} placeholder="What changed and why" /></label>
              <div className="flex flex-wrap gap-2">
                <button name="intent" value="draft" className={`${btn} bg-navy-deep text-white hover:bg-navy`}>Save draft</button>
                <button name="intent" value="review" className={`${btn} border border-navy-deep text-navy-deep hover:bg-slate-50`}>Save and send for review</button>
              </div>
            </form>
          </Card>
        )}

        <Card>
          <CardHead title="Versions" sub="Every saved version is kept. Preview opens the real page in a separate tab, visible only to you." />
          {revs.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No versions yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {revs.map((r) => {
                const st = STATUS[r.status] ?? STATUS.draft;
                const own = r.author_id === user?.id;
                const unpublished = r.status === 'draft' || r.status === 'in_review';
                return (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Pill tone={st.tone}>{st.label}</Pill>
                      <span className="text-slate-500">{ago(r.created_at)} by {who.get(r.author_id) ?? 'a team member'}</span>
                      {r.note && <span className="text-slate-600">· {r.note}</span>}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-800"><Summary type={def.type} c={r.content} /></p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {canWrite(role) && (
                        <a href={`/api/cms/preview?rev=${r.id}&to=${encodeURIComponent(previewPath)}`} target="_blank" rel="noopener" className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                          Preview <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                      {unpublished && (own || admin) && r.status === 'draft' && (
                        <form action={setStatus}><input type="hidden" name="key" value={key} /><input type="hidden" name="revision" value={r.id} /><input type="hidden" name="status" value="in_review" />
                          <button className={`${btn} border border-navy-deep text-navy-deep hover:bg-slate-50`}>Send for review</button></form>
                      )}
                      {admin && r.status !== 'published' && (
                        <form action={publish} className="flex items-center gap-2"><input type="hidden" name="key" value={key} /><input type="hidden" name="revision" value={r.id} />
                          <button className={`${btn} bg-emerald-700 text-white hover:bg-emerald-800`}>{r.status === 'archived' ? 'Restore and publish' : 'Approve and publish'}</button></form>
                      )}
                      {unpublished && (own || admin) && (
                        <form action={setStatus}><input type="hidden" name="key" value={key} /><input type="hidden" name="revision" value={r.id} /><input type="hidden" name="status" value="archived" />
                          <button className={`${btn} text-red-700 hover:bg-red-50`}>Discard</button></form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <p className="text-xs text-slate-500">In preview, leave with <a className="underline" href={`/api/cms/preview?exit=1&to=${encodeURIComponent(previewPath)}`} target="_blank" rel="noopener">exit preview</a>.</p>
      </div>
    </>
  );
}

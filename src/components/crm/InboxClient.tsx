'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail, Phone, Loader2, ArrowRightCircle, Star, Archive, ArchiveRestore, Search, ChevronLeft,
  CalendarCheck, Inbox as InboxIcon, Globe, MousePointerClick, Trash2, Send, Lock,
} from 'lucide-react';
import { serviceLabel } from '@/lib/services';
import { ago, dateLabel } from '@/components/crm/ui';
import type { Board } from '@/lib/crm/board';
import {
  setInquiryStatus, setBookingStatus, assignLead, setStar, setArchived, listNotes, addNote, deleteNote, inquiryToTask,
  type LeadType, type Note, type Result,
} from '@/app/(dashboard)/dashboard/inbox/actions';

/**
 * The inbox as conversations: every form and appointment request on the left,
 * the one you are reading on the right with its details as a card and the
 * team's notes underneath. Replies by email are not sent from here yet; the
 * thread is ready for them (lead_messages.channel) when they arrive.
 */
export type Conversation = {
  key: string;
  type: LeadType;
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  status: string;
  owner_id: string | null;
  starred: boolean;
  archived: boolean;
  preview: string;
  source: string | null;
  cta: string | null;
  source_page: string | null;
  service_interested?: string | null;
  message?: string | null;
  requested_slot?: string | null;
  notes?: string | null;
  linked_task?: boolean;
};
export type Member = { id: string; display_name: string | null; role: string; job_title: string | null };

const STATUS_TONE: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800 ring-sky-200',
  contacted: 'bg-amber-100 text-amber-900 ring-amber-200',
  qualified: 'bg-violet-100 text-violet-800 ring-violet-200',
  converted: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  requested: 'bg-sky-100 text-sky-800 ring-sky-200',
  confirmed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-red-100 text-red-800 ring-red-200',
};
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'];
const BOOKING_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];
const FILTERS = [
  { k: 'all', label: 'All' }, { k: 'unassigned', label: 'Unassigned' }, { k: 'mine', label: 'Mine' },
  { k: 'starred', label: 'Starred' }, { k: 'archived', label: 'Archived' },
] as const;
type FilterKey = (typeof FILTERS)[number]['k'];

const AVATAR = ['bg-pink-600', 'bg-sky-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
function avatarTone(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}
const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

export default function InboxClient({
  conversations, members, boards, canWrite, userId, initialKey,
}: {
  conversations: Conversation[]; members: Member[]; boards: Board[];
  canWrite: boolean; userId: string | null; initialKey?: string;
}) {
  const [list, setList] = useState(conversations);
  const [filter, setFilter] = useState<FilterKey>(() => conversations.find(c => c.key === initialKey)?.archived ? 'archived' : 'all');
  const [kind, setKind] = useState<'all' | LeadType>('all');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey ?? conversations[0]?.key ?? null);
  const [mobileThread, setMobileThread] = useState(Boolean(initialKey));
  const [notes, setNotes] = useState<Record<string, Note[] | undefined>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [board, setBoard] = useState(boards[0]?.id ?? '');
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const savingNotes = useRef(new Set<string>());

  // Fresh server data replaces the working copy (the React-sanctioned way, during render).
  const [seen, setSeen] = useState(conversations);
  if (seen !== conversations) { setSeen(conversations); setList(conversations); }
  // App Router preserves this component on same-route navigation, and opening
  // the same notification twice gives the same initialKey prop. So follow the
  // address bar's ?c= instead: list clicks keep it in step (replaceState), and
  // a notification link that differs from it selects its conversation.
  const searchParams = useSearchParams();
  const urlKey = searchParams?.get('c') ?? initialKey;
  const [seenUrlKey, setSeenUrlKey] = useState(urlKey);
  if (seenUrlKey !== urlKey) {
    setSeenUrlKey(urlKey);
    if (urlKey && urlKey !== selectedKey) {
      setSelectedKey(urlKey);
      setFilter(conversations.find(c => c.key === urlKey)?.archived ? 'archived' : 'all');
      setKind('all');
      setQuery('');
      setMobileThread(true);
    }
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (filter === 'archived' ? !c.archived : c.archived) return false;
      if (filter === 'unassigned' && c.owner_id) return false;
      if (filter === 'mine' && c.owner_id !== userId) return false;
      if (filter === 'starred' && !c.starred) return false;
      if (kind !== 'all' && c.type !== kind) return false;
      if (q && ![c.name, c.email, c.phone, c.preview, c.service_interested, c.message, c.notes].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [list, filter, kind, query, userId]);

  // The open conversation must be in the visible list; otherwise show the first visible one.
  const selected = shown.find((c) => c.key === selectedKey) ?? shown[0] ?? null;
  const draft = selected ? drafts[selected.key] ?? '' : '';
  const setDraft = (value: string) => {
    if (selected) setDrafts((ds) => ({ ...ds, [selected.key]: value }));
  };

  // Notes load once per conversation; a request in flight is remembered so
  // patches to the selected row do not start another.
  const loadingNotes = useRef(new Set<string>());
  const selectedKeyNow = selected?.key, selectedType = selected?.type, selectedId = selected?.id;
  useEffect(() => {
    if (!selectedKeyNow || !selectedType || !selectedId) return;
    if (notes[selectedKeyNow] || loadingNotes.current.has(selectedKeyNow)) return;
    const key = selectedKeyNow;
    loadingNotes.current.add(key);
    listNotes(selectedType, selectedId)
      .then((rows) => setNotes((n) => ({ ...n, [key]: rows })))
      .finally(() => loadingNotes.current.delete(key));
  }, [selectedKeyNow, selectedType, selectedId, notes]);

  const who = (id: string | null | undefined) => (id ? members.find((m) => m.id === id) : undefined);
  const memberName = (id: string | null | undefined) => who(id)?.display_name || (id ? 'Team member' : 'Nobody');

  function patch(key: string, change: Partial<Conversation>) {
    setList((xs) => xs.map((x) => (x.key === key ? { ...x, ...change } : x)));
  }
  function run(fn: () => Promise<Result>, onOk?: () => void) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { text: r.note ?? 'Done.' } : { text: r.error, bad: true });
      if (r.ok) onOk?.();
    });
  }

  async function submitNote() {
    if (!selected || !draft.trim() || savingNotes.current.has(selected.key)) return;
    const key = selected.key, body = draft;
    // A ref closes the gap before React renders the pending button state.
    savingNotes.current.add(key);
    start(async () => {
      try {
        const r = await addNote(selected.type, selected.id, body);
        if (r.ok && r.row) {
          setNotes((n) => ({ ...n, [key]: [...(n[key] ?? []), r.row!] }));
          // A slow save must not clear text typed since submission, or another lead's draft.
          setDrafts((ds) => ds[key] === body ? { ...ds, [key]: '' } : ds);
        } else {
          setMsg({ text: r.ok ? 'Saved.' : r.error, bad: !r.ok });
        }
      } catch {
        setMsg({ text: 'Could not save the note. Your draft is still here; please try again.', bad: true });
      } finally {
        savingNotes.current.delete(key);
      }
    });
  }

  const unreadCount = list.filter((c) => !c.archived && (c.status === 'new' || c.status === 'requested')).length;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:h-[calc(100dvh-8.5rem)]">
      {msg && (
        <p role={msg.bad ? 'alert' : 'status'} className={`mx-5 mt-3 rounded-lg px-3 py-2 text-xs font-semibold sm:mx-8 ${msg.bad ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {msg.text}
        </p>
      )}
      <div className="mx-5 my-4 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white sm:mx-8">
        {/* ── Conversation list ── */}
        <aside className={`w-full shrink-0 flex-col border-r border-slate-200 lg:flex lg:w-[22rem] ${mobileThread ? 'hidden' : 'flex'}`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <select aria-label="Filter conversations" value={filter} onChange={(e) => setFilter(e.target.value as FilterKey)} className="rounded-lg border-0 bg-transparent py-1 pl-0 pr-7 text-sm font-semibold text-navy-deep focus:ring-0">
                {FILTERS.map((f) => <option key={f.k} value={f.k}>{f.label} conversations</option>)}
              </select>
              <span className="ml-auto text-xs text-slate-500">{unreadCount} new</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, message" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm focus:border-navy focus:bg-white focus:outline-none" />
              </label>
              <select aria-label="Conversation type" value={kind} onChange={(e) => setKind(e.target.value as 'all' | LeadType)} className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2 pr-7 text-xs">
                <option value="all">All types</option><option value="inquiry">Forms</option><option value="booking">Appointments</option>
              </select>
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {shown.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">Nothing here.</li>}
            {shown.map((c) => {
              const active = c.key === selected?.key;
              const fresh = c.status === 'new' || c.status === 'requested';
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKey(c.key); setMobileThread(true);
                      // Keep ?c= in step without a server round trip, so re-opening a notification link selects it again.
                      if (typeof window !== 'undefined') window.history.replaceState(null, '', `?c=${encodeURIComponent(c.key)}`);
                    }}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left hover:bg-slate-50 ${active ? 'bg-sky-50/70' : ''}`}
                  >
                    <span className={`relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-bold text-white ${avatarTone(c.name)}`}>
                      {initial(c.name)}
                      <span className={`absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-white ring-2 ring-white ${c.type === 'booking' ? 'text-emerald-700' : 'text-sky-700'}`}>
                        {c.type === 'booking' ? <CalendarCheck className="h-3 w-3" /> : <InboxIcon className="h-3 w-3" />}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${fresh ? 'font-bold text-navy-deep' : 'font-medium text-slate-800'}`}>{c.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{ago(c.created_at)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        {c.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                        <span className={`truncate text-sm ${fresh ? 'text-slate-800' : 'text-slate-500'}`}>{c.type === 'booking' ? 'Consultation request' : 'Contacts form'}{c.preview ? ` · ${c.preview}` : ''}</span>
                      </span>
                    </span>
                    {fresh && <span aria-hidden className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Thread ── */}
        <section className={`min-w-0 flex-1 flex-col lg:flex ${mobileThread ? 'flex' : 'hidden'}`}>
          {!selected ? (
            <p className="m-auto p-10 text-sm text-slate-500">Choose a conversation.</p>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button type="button" onClick={() => setMobileThread(false)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Back to list"><ChevronLeft className="h-5 w-5" /></button>
                <span className={`grid h-10 w-10 place-items-center rounded-full text-base font-bold text-white ${avatarTone(selected.name)}`}>{initial(selected.name)}</span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-navy-deep">{selected.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Assigned to</span>
                    {canWrite ? (
                      <select
                        aria-label="Assign to"
                        value={selected.owner_id ?? ''}
                        onChange={(e) => { const v = e.target.value || null; run(() => assignLead(selected.type, selected.id, v), () => patch(selected.key, { owner_id: v })); }}
                        className="rounded border-0 bg-transparent py-0 pl-0 pr-6 text-xs font-semibold text-navy-deep focus:ring-0"
                      >
                        <option value="">Nobody yet</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.display_name || 'Team member'}{m.id === userId ? ' (you)' : ''}</option>)}
                      </select>
                    ) : <span className="font-semibold">{memberName(selected.owner_id)}</span>}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {canWrite && (
                    <>
                      <button type="button" title={selected.starred ? 'Remove star' : 'Star'} onClick={() => run(() => setStar(selected.type, selected.id, !selected.starred), () => patch(selected.key, { starred: !selected.starred }))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        <Star className={`h-4 w-4 ${selected.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button type="button" title={selected.archived ? 'Move back to inbox' : 'Archive'} onClick={() => run(() => setArchived(selected.type, selected.id, !selected.archived), () => patch(selected.key, { archived: !selected.archived }))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        {selected.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </button>
                    </>
                  )}
                  <select
                    aria-label="Status"
                    value={selected.status}
                    disabled={!canWrite}
                    onChange={(e) => { const v = e.target.value; run(() => (selected.type === 'inquiry' ? setInquiryStatus(selected.id, v) : setBookingStatus(selected.id, v)), () => patch(selected.key, { status: v })); }}
                    className={`rounded-full border-0 py-1 pl-3 pr-8 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[selected.status] ?? ''}`}
                  >
                    {(selected.type === 'inquiry' ? STATUSES : BOOKING_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
                <div className="flex gap-3">
                  <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${avatarTone(selected.name)}`}>{initial(selected.name)}</span>
                  <div className="max-w-xl rounded-2xl rounded-tl-sm border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-3 text-base font-semibold text-navy-deep">
                      {selected.type === 'booking' ? 'Consultation request' : 'Contacts form'}
                    </div>
                    <dl className="grid gap-3 px-5 py-4 text-sm">
                      <Field label="Name">{selected.name}</Field>
                      {selected.email && <Field label="Email"><a href={`mailto:${selected.email}`} className="text-navy underline-offset-2 hover:underline">{selected.email}</a></Field>}
                      {selected.phone && <Field label="Phone"><a href={`tel:${selected.phone}`} className="text-navy underline-offset-2 hover:underline">{selected.phone}</a></Field>}
                      {selected.service_interested && <Field label="Service">{serviceLabel(selected.service_interested) ?? selected.service_interested}</Field>}
                      {selected.type === 'inquiry' && selected.message && <Field label="Message"><span className="whitespace-pre-wrap">{selected.message}</span></Field>}
                      {selected.type === 'booking' && selected.requested_slot && <Field label="Requested time">{new Date(selected.requested_slot).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Field>}
                      {selected.type === 'booking' && selected.notes && <Field label="Notes"><span className="whitespace-pre-wrap">{selected.notes}</span></Field>}
                    </dl>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-500">
                      <span>{dateLabel(selected.created_at)}</span>
                      {selected.source_page && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{selected.source_page}</span>}
                      {selected.cta && <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{selected.cta}</span>}
                      {selected.source && <span>from {selected.source}</span>}
                    </div>
                  </div>
                </div>

                {(notes[selected.key] ?? []).map((n) => (
                  <div key={n.id} className="flex justify-end gap-3">
                    <div className="max-w-xl rounded-2xl rounded-tr-sm bg-amber-50 px-4 py-3 text-sm text-slate-800 ring-1 ring-amber-200">
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-amber-900/80">
                        <Lock className="h-3 w-3" /> Internal note · {memberName(n.author_id)} · {ago(n.created_at)}
                        {canWrite && (n.author_id === userId) && (
                          <button type="button" title="Remove note" onClick={() => run(() => deleteNote(n.id), () => setNotes((x) => ({ ...x, [selected.key]: (x[selected.key] ?? []).filter((y) => y.id !== n.id) })))} className="ml-auto rounded p-0.5 hover:bg-amber-100"><Trash2 className="h-3 w-3" /></button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{n.body}</p>
                    </div>
                  </div>
                ))}
                {notes[selected.key] === undefined && <p className="text-center text-xs text-slate-400">Loading notes…</p>}
                {notes[selected.key]?.length === 0 && <p className="text-center text-xs text-slate-400">No notes yet.</p>}
              </div>

              <footer className="border-t border-slate-200 px-4 py-3 sm:px-6">
                {canWrite ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Internal note</span>
                      <span>visible to the team only</span>
                      {selected.type === 'inquiry' && selected.linked_task === false && boards.length > 0 && (
                        <span className="ml-auto flex items-center gap-1.5">
                          <select aria-label="Board" value={board} onChange={(e) => setBoard(e.target.value)} className="rounded-md border border-slate-200 py-1 pl-2 pr-6 text-xs">
                            {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <button type="button" onClick={() => run(() => inquiryToTask(selected.id, board), () => patch(selected.key, { linked_task: true, status: selected.status === 'new' ? 'contacted' : selected.status }))} className="inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy-deep">
                            <ArrowRightCircle className="h-3.5 w-3.5" /> Make a work card
                          </button>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submitNote(); } }}
                        rows={2}
                        placeholder="Type a note for the team… (Ctrl+Enter to add)"
                        className="min-h-[2.75rem] flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                      />
                      <button type="button" onClick={submitNote} disabled={pending || !draft.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-navy-deep px-4 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add note
                      </button>
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-x-4 text-[11px] text-slate-500">
                      {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-navy"><Mail className="h-3 w-3" /> Email in your mail app</a>}
                      {selected.phone && <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1 hover:text-navy"><Phone className="h-3 w-3" /> Call</a>}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Read only. The operations team works the inbox.</p>
                )}
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{children}</dd>
    </div>
  );
}

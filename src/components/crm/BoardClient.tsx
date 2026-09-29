'use client';

import { useState, useTransition } from 'react';
import { Plus, X, User, CalendarClock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  STAGES, WORK_TYPES, PRIORITIES, typeMeta, priorityMeta, isOverdue, type WorkItem,
} from '@/lib/crm/board';
import { dateLabel } from '@/components/crm/ui';
import { createItem, moveItem, claimItem } from '@/app/(dashboard)/dashboard/board/actions';

const stageIndex = (k: string) => STAGES.findIndex((s) => s.key === k);

function Card({
  item, canWrite, mine, busy, onMove, onClaim,
}: {
  item: WorkItem; canWrite: boolean; mine: boolean; busy: boolean;
  onMove: (dir: -1 | 1) => void; onClaim: () => void;
}) {
  const t = typeMeta(item.work_type);
  const p = priorityMeta(item.priority);
  const i = stageIndex(item.stage);
  const late = isOverdue(item);

  return (
    <article
      className={`group rounded-lg border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition ${
        busy ? 'opacity-50' : 'hover:border-slate-300 hover:shadow-md'
      } ${late ? 'border-red-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded ring-1 ring-inset ${t.tone}`}>
          <t.icon className="h-3 w-3" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-navy-deep">{item.title}</p>
        {item.priority !== 'normal' && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${p.tone}`}>
            {p.label}
          </span>
        )}
      </div>

      {item.notes && (
        <p className="mt-2 line-clamp-2 pl-7 text-xs leading-relaxed text-slate-500">{item.notes}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-7 text-[11px] text-slate-500">
        {item.due_at && (
          <span className={`inline-flex items-center gap-1 ${late ? 'font-semibold text-red-600' : ''}`}>
            <CalendarClock className="h-3 w-3" />
            {dateLabel(item.due_at)}
          </span>
        )}
        {mine && (
          <span className="inline-flex items-center gap-1 rounded bg-gold/20 px-1.5 py-0.5 font-semibold text-navy">
            <User className="h-3 w-3" /> Mine
          </span>
        )}
        {item.labels?.map((l) => (
          <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{l}</span>
        ))}
      </div>

      {canWrite && (
        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => onMove(-1)}
            disabled={i <= 0 || busy}
            aria-label={`Move "${item.title}" left`}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={i >= STAGES.length - 1 || busy}
            aria-label={`Move "${item.title}" right`}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={onClaim}
            disabled={busy}
            className="ml-auto rounded px-2 py-1 text-[11px] font-semibold text-steel hover:bg-slate-100"
          >
            {mine ? 'Release' : 'Take it'}
          </button>
        </div>
      )}
    </article>
  );
}

export default function BoardClient({
  items, canWrite, userId,
}: { items: WorkItem[]; canWrite: boolean; userId: string | null }) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function move(item: WorkItem, dir: -1 | 1) {
    const next = STAGES[stageIndex(item.stage) + dir];
    if (!next) return;
    setBusyId(item.id);
    setError(null);
    start(async () => {
      const r = await moveItem(item.id, next.key);
      if (!r.ok) setError(r.error);
      setBusyId(null);
    });
  }

  function claim(item: WorkItem) {
    setBusyId(item.id);
    setError(null);
    start(async () => {
      const r = await claimItem(item.id, item.owner_id !== userId);
      if (!r.ok) setError(r.error);
      setBusyId(null);
    });
  }

  return (
    <div className="p-5 sm:p-8">
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const col = items
            .filter((i) => i.stage === stage.key)
            .sort((a, b) => a.position - b.position);
          return (
            <section key={stage.key} className="flex w-[86vw] shrink-0 flex-col sm:w-[300px]">
              <div className="mb-3 flex items-center gap-2">
                <stage.icon className="h-4 w-4 text-steel" />
                <h2 className="text-sm font-bold text-navy-deep">{stage.label}</h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                  {col.length}
                </span>
                {canWrite && (
                  <button
                    onClick={() => { setAdding(adding === stage.key ? null : stage.key); setError(null); }}
                    aria-label={`Add an item to ${stage.label}`}
                    className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white hover:text-navy"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mb-3 text-[11px] text-slate-400">{stage.hint}</p>

              {adding === stage.key && (
                <form
                  action={(fd) => {
                    setError(null);
                    start(async () => {
                      const r = await createItem(fd);
                      if (r.ok) setAdding(null);
                      else setError(r.error);
                    });
                  }}
                  className="mb-3 rounded-lg border border-navy/20 bg-white p-3 shadow-sm"
                >
                  <input type="hidden" name="stage" value={stage.key} />
                  <div className="flex items-center justify-between">
                    <label htmlFor={`t-${stage.key}`} className="text-xs font-bold text-navy-deep">
                      New item
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdding(null)}
                      aria-label="Cancel"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    id={`t-${stage.key}`}
                    name="title"
                    required
                    autoFocus
                    placeholder="What needs doing?"
                    className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Any detail (optional)"
                    className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select name="work_type" defaultValue="task" aria-label="Type"
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                      {WORK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                    <select name="priority" defaultValue="normal" aria-label="Priority"
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                      {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                  <input type="date" name="due_at" aria-label="Due date"
                    className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs" />
                  <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" name="mine" className="rounded border-slate-300" />
                    Assign it to me
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy-dark disabled:opacity-60"
                  >
                    {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Add to {stage.label}
                  </button>
                </form>
              )}

              <div className="space-y-2.5">
                {col.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    canWrite={canWrite}
                    mine={!!userId && item.owner_id === userId}
                    busy={busyId === item.id}
                    onMove={(d) => move(item, d)}
                    onClaim={() => claim(item)}
                  />
                ))}
                {col.length === 0 && adding !== stage.key && (
                  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                    Nothing here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

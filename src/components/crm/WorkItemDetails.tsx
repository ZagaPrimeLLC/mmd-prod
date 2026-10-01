'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Send } from 'lucide-react';
import { saveItemDetails, addItemComment } from '@/app/(dashboard)/dashboard/board/actions';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-navy-deep focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 disabled:bg-slate-50';
const button = 'inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60';

export function WorkItemDetails({
  id, title, notes, canWrite,
}: { id: string; title: string; notes: string | null; canWrite: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftNotes, setDraftNotes] = useState(notes ?? '');
  const [original, setOriginal] = useState({ title, notes });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!editing) return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-navy-deep">Details</h2>
        {canWrite && <button type="button" onClick={() => {
          setOriginal({ title, notes }); setDraftTitle(title); setDraftNotes(notes ?? '');
          setEditing(true); setError(null); setSaved(false);
        }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-slate-100">
          <Pencil className="h-3.5 w-3.5" /> Edit details
        </button>}
      </div>
      {saved && <p role="status" className="mt-3 text-sm text-emerald-700">Details saved.</p>}
      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
      <p className="mt-2 break-words text-base font-medium text-navy-deep">{title}</p>
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed ${notes ? 'text-slate-700' : 'text-slate-400'}`}>
        {notes || 'No notes yet.'}
      </p>
    </div>
  );

  return (
    <form className="space-y-5 p-5 sm:p-6" action={(form) => start(async () => {
      setError(null);
      try {
        const result = await saveItemDetails(id, original, form);
        if (!result.ok) { setError(result.error); return; }
        setEditing(false); setSaved(true);
      } catch { setError('Could not save right now. Your edits are still here; please try again.'); }
    })}>
      <h2 className="text-sm font-bold text-navy-deep">Edit details</h2>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div>
        <label htmlFor="item-summary" className="mb-2 block text-sm font-semibold text-navy-deep">Summary</label>
        <input id="item-summary" name="title" required maxLength={200} autoFocus disabled={pending}
          value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="item-notes" className="mb-2 block text-sm font-semibold text-navy-deep">Notes</label>
        <textarea id="item-notes" name="notes" rows={8} maxLength={4000} disabled={pending}
          value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} className={field}
          placeholder="Add context, instructions, or progress notes." />
        <p className="mt-1 text-xs text-slate-400">Up to 4,000 characters.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending || !draftTitle.trim()} className={button}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {pending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" disabled={pending} onClick={() => setEditing(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">Cancel</button>
      </div>
    </form>
  );
}

export function WorkItemCommentForm({ id, latestHref }: { id: string; latestHref: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  return (
    <form className="border-b border-slate-100 p-5 sm:p-6" action={(form) => start(async () => {
      setError(null); setPosted(false);
      try {
        const result = await addItemComment(id, form);
        if (!result.ok) { setError(result.error); return; }
        setBody(''); setPosted(true);
        router.replace(latestHref, { scroll: false });
      } catch { setError('Could not post right now. Your comment is still here; please try again.'); }
    })}>
      <label htmlFor="item-comment" className="mb-2 block text-sm font-semibold text-navy-deep">Add a comment</label>
      <textarea id="item-comment" name="body" required maxLength={4000} rows={3} disabled={pending}
        value={body} onChange={(event) => { setBody(event.target.value); setPosted(false); }}
        placeholder="Share an update or ask a question." className={field} />
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {posted && <p role="status" className="mt-2 text-sm text-emerald-700">Comment added.</p>}
      <button type="submit" disabled={pending || !body.trim()} className={`${button} mt-3`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  );
}

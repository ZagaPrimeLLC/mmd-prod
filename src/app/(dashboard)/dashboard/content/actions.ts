'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import { slotByKey, isProtected, validate, type BlockType } from '@/lib/cms/slots';
import { slotTags } from '@/lib/cms/read';

/**
 * The editing workflow: ops and admin save drafts, anyone who wrote a draft can
 * submit it for review, only an administrator publishes (the database enforces
 * the same rules through row-level security and cms_publish()).
 */

function back(key: string, msg: string, kind: 'ok' | 'err' = 'ok'): never {
  redirect(`/dashboard/content/${encodeURIComponent(key)}?${kind}=${encodeURIComponent(msg)}`);
}

/** Builds the raw content object for the slot type from the posted form. */
function fromForm(type: BlockType, fd: FormData): unknown {
  const g = (k: string) => fd.get(k);
  switch (type) {
    case 'text': return { text: g('text') };
    case 'heroTitle': return { lead: g('lead'), accent: g('accent') };
    case 'cta': return { label: g('label'), href: g('href') };
    case 'paragraphs': return { paragraphs: g('paragraphs') };
    case 'list': return { items: g('items') };
    case 'highlights': {
      const titles = fd.getAll('highlight_title'), bodies = fd.getAll('highlight_body');
      return { items: titles.map((title, i) => ({ title, body: bodies[i] })) };
    }
    case 'faq': return { items: g('items') };
    case 'announcement': return { text: g('text'), href: g('href') };
    case 'schedule': return { days: fd.getAll('days'), start: g('start'), end: g('end'), closed: g('closed') };
  }
}

export async function saveDraft(fd: FormData) {
  const key = String(fd.get('key') ?? '');
  const def = slotByKey(key);
  if (!def) redirect('/dashboard/content');
  const { supabase, user, role } = await getSession();
  if (!user || !canWrite(role)) back(key, 'You cannot edit content.', 'err');
  if (isProtected(key) && role !== 'admin') back(key, 'Only an administrator can change this setting.', 'err');

  const v = validate(def.type, fromForm(def.type, fd));
  if (!v.ok) back(key, v.error, 'err');
  const note = String(fd.get('note') ?? '').trim().slice(0, 200) || null;
  const submit = fd.get('intent') === 'review';

  const { error } = await supabase.from('cms_revisions').insert({
    slot_key: key, content: v.content, status: submit ? 'in_review' : 'draft', note, author_id: user.id,
  });
  if (error) back(key, `Could not save: ${error.message}`, 'err');
  back(key, submit ? 'Draft saved and sent for review.' : 'Draft saved.');
}

export async function setStatus(fd: FormData) {
  const key = String(fd.get('key') ?? '');
  const id = String(fd.get('revision') ?? '');
  const status = String(fd.get('status') ?? '');
  if (!slotByKey(key) || !['draft', 'in_review', 'archived'].includes(status)) redirect('/dashboard/content');
  const { supabase, role } = await getSession();
  if (!canWrite(role)) back(key, 'You cannot edit content.', 'err');
  const { error, count } = await supabase.from('cms_revisions').update({ status }, { count: 'exact' }).eq('id', id).in('status', ['draft', 'in_review']);
  if (error) back(key, `Could not update: ${error.message}`, 'err');
  if (!count) back(key, 'That revision could not be changed (already published, or not yours).', 'err');
  back(key, status === 'archived' ? 'Draft discarded.' : status === 'in_review' ? 'Sent for review.' : 'Moved back to draft.');
}

export async function publish(fd: FormData) {
  const key = String(fd.get('key') ?? '');
  const id = String(fd.get('revision') ?? '');
  const def = slotByKey(key);
  if (!def) redirect('/dashboard/content');
  const { supabase, role } = await getSession();
  if (role !== 'admin') back(key, 'Only an administrator can publish.', 'err');

  // The exact revision is published, after a final validation of its content.
  const { data: rev } = await supabase.from('cms_revisions').select('id, slot_key, content, status').eq('id', id).maybeSingle();
  if (!rev || rev.slot_key !== key) back(key, 'That revision was not found.', 'err');
  const v = validate(def.type, rev.content);
  if (!v.ok) back(key, `This revision is not valid any more: ${v.error}`, 'err');

  const note = String(fd.get('note') ?? '').trim().slice(0, 200) || null;
  const { error } = await supabase.rpc('cms_publish', { p_revision: id, p_note: note });
  if (error) back(key, `Could not publish: ${error.message}`, 'err');

  // Refresh what shows it. Failures here are logged, not fatal: the database is already correct.
  try {
    for (const t of slotTags(key)) updateTag(t);
    // Slots shown on every page (such as the announcement bar) live in the
    // site layout, so the whole public tree is refreshed; it re-renders on demand.
    revalidatePath('/', 'layout');
    for (const p of def.paths) revalidatePath(p);
  } catch (e) {
    console.error('cms: revalidation after publish failed', e);
  }
  back(key, rev.status === 'archived' ? 'Earlier version restored and live.' : 'Published. The site is updating.');
}

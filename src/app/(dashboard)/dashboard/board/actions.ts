'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { STAGE_KEYS } from '@/lib/crm/board';

/**
 * Every action here is also gated by row level security, so a leadership
 * account that posted one of these by hand would still be refused by the
 * database. These checks exist to give a clear message, not to be the lock.
 */
async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc('mmd_role');
  return { supabase, user, canWrite: role === 'admin' || role === 'ops' };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createItem(form: FormData): Promise<ActionResult> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Your role cannot change the board.' };

  const title = String(form.get('title') ?? '').trim();
  if (!title) return { ok: false, error: 'Give the item a title.' };

  const stage = String(form.get('stage') ?? 'backlog');
  if (!STAGE_KEYS.includes(stage as never)) return { ok: false, error: 'Unknown column.' };

  const dueRaw = String(form.get('due_at') ?? '').trim();

  const { error } = await supabase.from('tasks').insert({
    title: title.slice(0, 200),
    notes: String(form.get('notes') ?? '').trim().slice(0, 4000) || null,
    work_type: String(form.get('work_type') ?? 'task'),
    priority: String(form.get('priority') ?? 'normal'),
    stage,
    due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
    created_by: user?.id ?? null,
    owner_id: form.get('mine') ? user?.id ?? null : null,
    position: Date.now(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/board');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function moveItem(id: string, stage: string): Promise<ActionResult> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Your role cannot change the board.' };
  if (!STAGE_KEYS.includes(stage as never)) return { ok: false, error: 'Unknown column.' };

  const { error } = await supabase
    .from('tasks')
    .update({
      stage,
      completed_at: stage === 'done' ? new Date().toISOString() : null,
      status: stage === 'done' ? 'done' : 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/board');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function claimItem(id: string, take: boolean): Promise<ActionResult> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Your role cannot change the board.' };

  const { error } = await supabase
    .from('tasks')
    .update({ owner_id: take ? user?.id ?? null : null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/board');
  revalidatePath('/dashboard/my-work');
  return { ok: true };
}

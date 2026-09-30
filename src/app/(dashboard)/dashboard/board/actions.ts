'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { STAGE_KEYS } from '@/lib/crm/board';

/**
 * Every action is also gated by row level security, so a leadership account
 * posting one of these by hand would still be refused by the database. These
 * checks exist to give a clear message, not to be the lock.
 */
async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc('mmd_role');
  return { supabase, user, canWrite: role === 'admin' || role === 'ops' };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const NO_WRITE = 'Your role can see this board but cannot change it.';

function touched() {
  revalidatePath('/dashboard/board');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/my-work');
}

export async function createItem(form: FormData): Promise<ActionResult> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };

  const title = String(form.get('title') ?? '').trim();
  if (!title) return { ok: false, error: 'Give the item a title.' };

  const stage = String(form.get('stage') ?? 'backlog');
  if (!STAGE_KEYS.includes(stage as never)) return { ok: false, error: 'Unknown column.' };

  const boardId = String(form.get('board_id') ?? '');
  if (!boardId) return { ok: false, error: 'No board chosen.' };

  const dueRaw = String(form.get('due_at') ?? '').trim();

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: title.slice(0, 200),
      notes: String(form.get('notes') ?? '').trim().slice(0, 4000) || null,
      work_type: String(form.get('work_type') ?? 'task'),
      priority: String(form.get('priority') ?? 'normal'),
      stage,
      due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
      created_by: user?.id ?? null,
      owner_id: form.get('mine') ? user?.id ?? null : null,
      position: Date.now(),
    })
    .select('id')
    .single();

  if (error || !task) return { ok: false, error: error?.message ?? 'Could not create that.' };

  // A card with no board is invisible to everyone but admin and ops, so it is
  // placed on the board it was created from in the same breath.
  const { error: linkErr } = await supabase
    .from('board_items')
    .insert({ board_id: boardId, task_id: task.id, position: Date.now(), added_by: user?.id ?? null });

  if (linkErr) return { ok: false, error: linkErr.message };

  touched();
  return { ok: true };
}

export async function moveItem(id: string, stage: string): Promise<ActionResult> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
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
  touched();
  return { ok: true };
}

export async function claimItem(id: string, take: boolean): Promise<ActionResult> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };

  const { error } = await supabase
    .from('tasks')
    .update({ owner_id: take ? user?.id ?? null : null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  touched();
  return { ok: true };
}

/**
 * Put an existing card on another board, or take it off one. There is still
 * only one task row behind it, so a change made on either board shows on both.
 */
export async function setBoardLink(
  taskId: string, boardId: string, on: boolean
): Promise<ActionResult> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };

  if (on) {
    const { error } = await supabase
      .from('board_items')
      .insert({ board_id: boardId, task_id: taskId, position: Date.now(), added_by: user?.id ?? null });
    if (error && !error.message.includes('duplicate')) return { ok: false, error: error.message };
  } else {
    // Refuse to strand a card where nobody but admin and ops can find it.
    const { count } = await supabase
      .from('board_items')
      .select('board_id', { count: 'exact', head: true })
      .eq('task_id', taskId);

    if ((count ?? 0) <= 1) {
      return { ok: false, error: 'This is the only board it is on. Put it on another board first, otherwise it disappears from every board.' };
    }

    const { error } = await supabase
      .from('board_items')
      .delete()
      .eq('task_id', taskId)
      .eq('board_id', boardId);
    if (error) return { ok: false, error: error.message };
  }

  touched();
  return { ok: true };
}

/**
 * Persists a drag. The client sends the whole target column in its new order,
 * which avoids fractional index drift and means one call covers both a move
 * between columns and a reorder within one.
 *
 * Stage lives on the task and position lives on the board link, so dragging a
 * shared card to Done moves it on every board it appears on, while reordering
 * it only affects the board you are looking at. That is deliberate.
 */
export async function applyColumnOrder(
  boardId: string, stage: string, orderedTaskIds: string[]
): Promise<ActionResult> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  if (!STAGE_KEYS.includes(stage as never)) return { ok: false, error: 'Unknown column.' };
  if (orderedTaskIds.length > 500) return { ok: false, error: 'Too many cards in one move.' };

  const ids = orderedTaskIds.filter((id) => typeof id === 'string' && id.length > 0);
  if (ids.length === 0) return { ok: true };

  // Only the cards whose column actually changed need a stage write.
  const { data: current } = await supabase
    .from('tasks')
    .select('id, stage')
    .in('id', ids);

  const needsStage = (current ?? []).filter((t) => t.stage !== stage).map((t) => t.id);

  if (needsStage.length > 0) {
    const { error } = await supabase
      .from('tasks')
      .update({
        stage,
        completed_at: stage === 'done' ? new Date().toISOString() : null,
        status: stage === 'done' ? 'done' : 'open',
        updated_at: new Date().toISOString(),
      })
      .in('id', needsStage);
    if (error) return { ok: false, error: error.message };
  }

  const rows = ids.map((taskId, i) => ({
    board_id: boardId,
    task_id: taskId,
    position: (i + 1) * 1000,
  }));

  const { error: posErr } = await supabase
    .from('board_items')
    .upsert(rows, { onConflict: 'board_id,task_id' });

  if (posErr) return { ok: false, error: posErr.message };

  touched();
  return { ok: true };
}

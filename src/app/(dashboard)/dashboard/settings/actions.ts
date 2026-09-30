'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const ROLES = ['admin', 'ops', 'leadership', 'viewer'];

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc('mmd_role');
  return { supabase, user, role, canWrite: role === 'admin' || role === 'ops', isAdmin: role === 'admin' };
}

export type Result = { ok: true; note?: string } | { ok: false; error: string };

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export async function createBoard(form: FormData): Promise<Result> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Only the operations team can create a board.' };

  const name = String(form.get('name') ?? '').trim();
  if (!name) return { ok: false, error: 'Give the board a name.' };

  const visible = ROLES.filter((r) => form.get(`role_${r}`));
  if (visible.length === 0) {
    return { ok: false, error: 'Choose at least one role, otherwise nobody could open it.' };
  }
  // Whoever creates a board must not lock themselves out of it.
  if (!visible.includes('admin')) visible.unshift('admin');

  const key = slug(name);
  if (!key) return { ok: false, error: 'That name has no letters or numbers in it.' };

  const { error } = await supabase.from('boards').insert({
    key,
    name: name.slice(0, 80),
    description: String(form.get('description') ?? '').trim().slice(0, 400) || null,
    visible_to: visible,
    position: Number(form.get('position') ?? 100),
    created_by: user?.id ?? null,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes('duplicate')
        ? 'There is already a board with that name.'
        : error.message,
    };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/board');
  return { ok: true, note: `${name} created.` };
}

export async function updateBoardVisibility(boardId: string, form: FormData): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Only the operations team can change a board.' };

  const visible = ROLES.filter((r) => form.get(`v_${boardId}_${r}`));
  if (visible.length === 0) {
    return { ok: false, error: 'Choose at least one role, otherwise nobody could open it.' };
  }
  if (!visible.includes('admin')) visible.unshift('admin');

  const { error } = await supabase
    .from('boards')
    .update({ visible_to: visible, updated_at: new Date().toISOString() })
    .eq('id', boardId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/board');
  return { ok: true, note: 'Who can open that board has been updated.' };
}

export async function archiveBoard(boardId: string): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: 'Only the operations team can archive a board.' };

  // Cards that live nowhere else would vanish from every board, so refuse.
  const { data: stranded } = await supabase.rpc('board_strands_cards', { p_board: boardId });
  if (typeof stranded === 'number' && stranded > 0) {
    return {
      ok: false,
      error: `${stranded} ${stranded === 1 ? 'card is' : 'cards are'} only on this board. Put them on another board first, otherwise they disappear.`,
    };
  }

  const { error } = await supabase
    .from('boards')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', boardId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/board');
  return { ok: true, note: 'Board archived. Nothing was deleted.' };
}

export async function setTeamRole(userId: string, role: string): Promise<Result> {
  const { supabase, user, isAdmin } = await ctx();
  if (!isAdmin) return { ok: false, error: 'Only an administrator can change roles.' };
  if (!ROLES.includes(role)) return { ok: false, error: 'Unknown role.' };
  if (userId === user?.id && role !== 'admin') {
    return { ok: false, error: 'That would remove your own administrator access. Ask another administrator to do it.' };
  }

  const { error } = await supabase
    .from('team_roles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/settings');
  return { ok: true, note: 'Role updated.' };
}

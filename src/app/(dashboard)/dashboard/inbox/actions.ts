'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function ctx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase.rpc('mmd_role');
  return { supabase, user, role: role as string | null, canWrite: role === 'admin' || role === 'ops' };
}

export type Result = { ok: true; note?: string } | { ok: false; error: string };
export type LeadType = 'inquiry' | 'booking';
export type Note = { id: string; body: string; author_id: string | null; created_at: string; channel: string; direction: string };

const NO_WRITE = 'Your role can see the inbox but cannot work it.';
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'];
const BOOKING_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];
const table = (t: LeadType) => (t === 'inquiry' ? 'inquiries' : 'bookings');
const NOTHING = 'Nothing changed: the record was not found, or it is not yours to change.';

function touched() {
  revalidatePath('/dashboard/inbox');
  revalidatePath('/dashboard/contacts');
  revalidatePath('/dashboard');
}

export async function setInquiryStatus(id: string, status: string): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  if (!STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };

  const { data: row, error } = await supabase
    .from('inquiries')
    .update({ status, handled_at: status === 'new' ? null : new Date().toISOString() })
    .eq('id', id)
    .select('contact_id')
    .single();
  if (error) return { ok: false, error: error.message };

  // The person's own status follows the enquiry, so the contacts list stays true.
  if (row?.contact_id) {
    await supabase.from('contacts').update({ status, updated_at: new Date().toISOString() }).eq('id', row.contact_id);
  }
  touched();
  return { ok: true, note: `Marked ${status}.` };
}

export async function setBookingStatus(id: string, status: string): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  if (!BOOKING_STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };
  const { data, error } = await supabase.from('bookings').update({ status }).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOTHING };
  touched();
  return { ok: true, note: `Appointment ${status}.` };
}

/** Assign to any team member (or nobody). */
export async function assignLead(type: LeadType, id: string, userId: string | null): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  const { data, error } = await supabase.from(table(type)).update({ owner_id: userId }).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOTHING };
  return { ok: true, note: userId ? 'Assigned.' : 'Unassigned.' };
}

/** Kept for older callers: take or release for yourself. */
export async function claimInquiry(id: string, take: boolean): Promise<Result> {
  const { user } = await ctx();
  return assignLead('inquiry', id, take ? user?.id ?? null : null);
}

export async function setStar(type: LeadType, id: string, starred: boolean): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  const { data, error } = await supabase.from(table(type)).update({ starred }).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOTHING };
  return { ok: true, note: starred ? 'Starred.' : 'Star removed.' };
}

export async function setArchived(type: LeadType, id: string, archived: boolean): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  const { data, error } = await supabase.from(table(type)).update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOTHING };
  touched();
  return { ok: true, note: archived ? 'Archived.' : 'Moved back to the inbox.' };
}

export async function listNotes(type: LeadType, id: string): Promise<Note[]> {
  const { supabase } = await ctx();
  const { data } = await supabase
    .from('lead_messages')
    .select('id, body, author_id, created_at, channel, direction')
    .eq('lead_type', type).eq('lead_id', id)
    .order('created_at');
  return (data ?? []) as Note[];
}

export async function addNote(type: LeadType, id: string, body: string): Promise<Result & { note?: string; row?: Note }> {
  const { supabase, user, canWrite } = await ctx();
  if (!canWrite || !user) return { ok: false, error: NO_WRITE };
  const text = body.trim().slice(0, 4000);
  if (!text) return { ok: false, error: 'Write something first.' };
  const { data, error } = await supabase
    .from('lead_messages')
    .insert({ lead_type: type, lead_id: id, body: text, author_id: user.id, channel: 'note', direction: 'internal' })
    .select('id, body, author_id, created_at, channel, direction')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, note: 'Note added.', row: data as Note };
}

export async function deleteNote(noteId: string): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  const { data, error } = await supabase.from('lead_messages').delete().eq('id', noteId).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOTHING };
  return { ok: true, note: 'Note removed.' };
}

/**
 * The point of the whole thing: an enquiry becomes a card someone owns, on a
 * board, with a due date. It carries the contact details across so nobody has
 * to go back and look them up.
 */
export async function inquiryToTask(inquiryId: string, boardId: string): Promise<Result> {
  const { supabase, canWrite } = await ctx();
  if (!canWrite) return { ok: false, error: NO_WRITE };
  if (!boardId) return { ok: false, error: 'Choose a board first.' };
  const { data, error } = await supabase.rpc('inquiry_to_task', { p_inquiry: inquiryId, p_board: boardId });
  if (error || !data?.id) return { ok: false, error: error?.message ?? 'Could not create the card.' };
  touched();
  revalidatePath('/dashboard/board');
  revalidatePath('/dashboard/my-work');
  return { ok: true, note: data.created ? 'Card created and assigned to you, due tomorrow.' : 'This enquiry already has a work card.' };
}

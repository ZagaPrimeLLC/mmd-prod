import PageHeader from '@/components/crm/PageHeader';
import InboxClient, { type Conversation, type Member } from '@/components/crm/InboxClient';
import { Notice } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import type { Board } from '@/lib/crm/board';
import { sourceLabel, type Attribution } from '@/lib/attribution';
import { storedLeadCta } from '@/lib/cta';
import { readAll } from '@/lib/supabase/read-all';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inbox' };

const slotText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const { supabase, user, role } = await getSession();
  const writes = canWrite(role);

  const [inqRes, bookRes, boardRes, linkedRes, membersRes] = await Promise.all([
    readAll((from, to) => supabase.from('inquiries').select('*').order('created_at', { ascending: false }).order('id').range(from, to)),
    readAll((from, to) => supabase.from('bookings').select('*').order('created_at', { ascending: false }).order('id').range(from, to)),
    supabase.from('boards').select('*').eq('archived', false).order('position'),
    readAll((from, to) => supabase.from('tasks').select('linked_id').eq('linked_type', 'inquiry').order('id').range(from, to)),
    supabase.rpc('team_members'),
  ]);
  const linked = new Set((linkedRes.data ?? []).map((t) => t.linked_id));

  const conversations: Conversation[] = [
    ...(inqRes.data ?? []).map((i) => ({
      key: `inquiry:${i.id}`, type: 'inquiry' as const, id: i.id as string,
      name: (i.name as string) || 'Unnamed', email: i.email, phone: i.phone,
      created_at: i.created_at, status: i.status, owner_id: i.owner_id,
      starred: Boolean(i.starred), archived: Boolean(i.archived_at),
      preview: (i.service_interested as string | null) || ((i.message as string | null) ?? '').slice(0, 80),
      source: sourceLabel(i.attribution as Attribution | null), cta: i.cta, source_page: i.source_page,
      service_interested: i.service_interested, message: i.message, linked_task: linkedRes.error ? undefined : linked.has(i.id),
    })),
    ...(bookRes.data ?? []).map((b) => ({
      key: `booking:${b.id}`, type: 'booking' as const, id: b.id as string,
      name: (b.name as string) || 'Unnamed', email: b.email, phone: b.phone,
      created_at: b.created_at, status: b.status, owner_id: b.owner_id,
      starred: Boolean(b.starred), archived: Boolean(b.archived_at),
      preview: slotText(b.requested_slot),
      source: sourceLabel(b.attribution as Attribution | null), cta: storedLeadCta(b.cta, b.attribution), source_page: '/contact',
      requested_slot: b.requested_slot, notes: b.notes,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const err = inqRes.error ?? bookRes.error;

  return (
    <>
      <PageHeader
        title="Inbox"
        lead="Everything the website sent us, as conversations. Open one, assign it, keep notes with the team, and turn it into a work card when it is real."
      />
      {err && <div className="px-5 pt-5 sm:px-8"><Notice tone="warn">Could not load the inbox: {err.message}</Notice></div>}
      {linkedRes.error && <div className="px-5 pt-5 sm:px-8"><Notice tone="warn">Could not check linked work cards. Card creation is unavailable until you reload successfully.</Notice></div>}
      <InboxClient
        conversations={conversations}
        members={(membersRes.data ?? []) as Member[]}
        boards={(boardRes.data ?? []) as Board[]}
        canWrite={writes}
        userId={user?.id ?? null}
        initialKey={c && conversations.some((x) => x.key === c) ? c : undefined}
      />
    </>
  );
}

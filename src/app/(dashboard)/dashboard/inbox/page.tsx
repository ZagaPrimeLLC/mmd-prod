import PageHeader from '@/components/crm/PageHeader';
import InboxClient from '@/components/crm/InboxClient';
import { Notice } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import type { Board } from '@/lib/crm/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inbox' };

export default async function InboxPage() {
  const { supabase, user, role } = await getSession();
  const writes = canWrite(role);

  const [inqRes, bookRes, boardRes, linkedRes] = await Promise.all([
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('bookings').select('*').order('requested_slot').limit(40),
    supabase.from('boards').select('*').eq('archived', false).order('position'),
    supabase.from('tasks').select('linked_id').eq('linked_type', 'inquiry'),
  ]);

  const linked = new Set((linkedRes.data ?? []).map((t) => t.linked_id));

  const inquiries = (inqRes.data ?? []).map((i) => ({
    id: i.id, name: i.name, email: i.email, phone: i.phone,
    service_interested: i.service_interested, message: i.message,
    source_page: i.source_page, cta: i.cta, status: i.status,
    owner_id: i.owner_id, created_at: i.created_at,
    linked_task: linked.has(i.id),
  }));

  const bookings = (bookRes.data ?? []).map((b) => ({
    id: b.id, name: b.name, email: b.email, phone: b.phone,
    requested_slot: b.requested_slot, notes: b.notes, status: b.status, cta: b.cta,
  }));

  return (
    <>
      <PageHeader
        title="Inbox"
        lead="Everything the website sent us: contact forms, careers applications, chat assistant conversations and appointment requests. Work a lead here and it becomes a card someone owns."
      />
      {inqRes.error && (
        <div className="px-5 pt-5 sm:px-8">
          <Notice tone="warn">Could not load the inbox: {inqRes.error.message}</Notice>
        </div>
      )}
      {!writes && (
        <div className="px-5 pt-5 sm:px-8">
          <Notice>This is a read only view. The operations team works the inbox.</Notice>
        </div>
      )}
      <InboxClient
        inquiries={inquiries}
        bookings={bookings}
        boards={(boardRes.data ?? []) as Board[]}
        canWrite={writes}
        userId={user?.id ?? null}
      />
    </>
  );
}

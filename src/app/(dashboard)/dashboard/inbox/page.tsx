import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Empty, Pill, ago } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { Mail, Phone, CalendarCheck, Inbox as InboxIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inbox' };

export default async function InboxPage() {
  const { supabase } = await getSession();

  const [inq, book] = await Promise.all([
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(60),
    supabase.from('bookings').select('*').order('requested_slot', { ascending: true }).limit(40),
  ]);

  const inquiries = inq.data ?? [];
  const bookings = book.data ?? [];

  return (
    <>
      <PageHeader
        title="Inbox"
        lead="Everything the public website sent us: contact forms, careers applications, chat assistant conversations and appointment requests."
      />
      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead title="Enquiries and applications" sub={`${inquiries.length} most recent`} icon={InboxIcon} />
          {inquiries.length === 0 ? (
            <div className="p-5"><Empty>Nothing has come in yet.</Empty></div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {inquiries.map((i) => (
                <li key={i.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-navy-deep">{i.name}</p>
                    <span className="text-xs text-slate-400">{ago(i.created_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {i.email && (
                      <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 hover:text-navy">
                        <Mail className="h-3 w-3" />{i.email}
                      </a>
                    )}
                    {i.phone && (
                      <a href={`tel:${i.phone}`} className="inline-flex items-center gap-1 hover:text-navy">
                        <Phone className="h-3 w-3" />{i.phone}
                      </a>
                    )}
                    <Pill>{i.service_interested ?? 'general'}</Pill>
                    {i.source_page && <span className="text-slate-400">via {i.source_page}</span>}
                  </div>
                  {i.message && (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                      {i.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="self-start">
          <CardHead title="Appointment requests" sub="Requested, not yet confirmed" icon={CalendarCheck} />
          {bookings.length === 0 ? (
            <div className="p-5"><Empty>No appointment requests.</Empty></div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <li key={b.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-deep">{b.name}</p>
                    <Pill>{b.status}</Pill>
                  </div>
                  <p className="mt-1 text-xs font-medium text-steel">
                    {b.requested_slot
                      ? new Date(b.requested_slot).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })
                      : 'no slot given'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{b.phone ?? b.email}</p>
                  {b.notes && <p className="mt-1.5 text-xs text-slate-600">{b.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

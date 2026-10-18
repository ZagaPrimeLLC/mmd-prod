import Link from 'next/link';
import { FileText, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/crm/PageHeader';
import { Card, CardHead, Notice, Pill, ago } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import { SLOTS, isProtected } from '@/lib/cms/slots';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content' };

type Rev = { id: string; slot_key: string; status: string; created_at: string; published_at: string | null };

export default async function ContentPage() {
  const { supabase, role } = await getSession();
  const writes = canWrite(role);
  const { data } = await supabase.from('cms_revisions').select('id, slot_key, status, created_at, published_at').order('created_at', { ascending: false });
  const revs = (data ?? []) as Rev[];

  const groups = [...new Set(SLOTS.map((s) => s.group))];

  return (
    <>
      <PageHeader
        title="Website content"
        lead={writes ? 'Edit the words on the public site. Save a draft, preview it, send it for review; an administrator publishes it.' : 'The editable parts of the public site and what is live.'}
      />
      <div className="space-y-6 p-5 sm:p-8">
        {!writes && <Notice>You can see what is published. Editing is for ops and admin.</Notice>}
        {groups.map((g) => (
          <Card key={g}>
            <CardHead title={g} icon={g === 'Office' ? ShieldCheck : FileText} sub={g === 'Office' ? 'Administrators only' : undefined} />
            <ul className="divide-y divide-slate-100">
              {SLOTS.filter((s) => s.group === g).map((s) => {
                const mine = revs.filter((r) => r.slot_key === s.key);
                const live = mine.find((r) => r.status === 'published');
                const pending = mine.filter((r) => r.status === 'in_review').length;
                const drafts = mine.filter((r) => r.status === 'draft').length;
                return (
                  <li key={s.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                    <Link href={`/dashboard/content/${encodeURIComponent(s.key)}`} className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy-deep hover:underline">{s.label}</span>
                      <span className="block text-xs text-slate-500">{s.help}</span>
                    </Link>
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                      {live ? <Pill tone="bg-emerald-50 text-emerald-800 ring-emerald-200">Live · published {ago(live.published_at)}</Pill> : <Pill tone="bg-slate-100 text-slate-700 ring-slate-200">Built-in text</Pill>}
                      {pending > 0 && <Pill tone="bg-amber-50 text-amber-800 ring-amber-200">{pending} awaiting review</Pill>}
                      {drafts > 0 && <Pill tone="bg-sky-50 text-sky-800 ring-sky-200">{drafts} draft{drafts > 1 ? 's' : ''}</Pill>}
                      {isProtected(s.key) && <Pill tone="bg-slate-100 text-slate-700 ring-slate-200">Admin</Pill>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
